import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Modal, Alert, FlatList } from 'react-native';
import { Heart, MessageCircle, Share2, Image as ImageIcon, X, MoveHorizontal as MoreHorizontal, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import { DEFAULT_PROFILE_PIC } from '@/constants/images';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Post = Database['public']['Tables']['posts']['Row'] & {
  user: Profile;
  likes: number;
  comments: number;
  liked_by_user: boolean;
};

const MAX_IMAGES = 4;
const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB

export default function SocialScreen() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Array<{
    id: string;
    content: string;
    created_at: string;
    user: Profile;
  }>>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts...');
      
      // Get all posts first
      const { data: allPosts, error: allPostsError } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles!posts_user_id_fkey(*),
          likes:likes(count),
          comments:comments(count)
        `)
        .order('created_at', { ascending: false });

      if (allPostsError) {
        console.error('Error fetching all posts:', allPostsError);
        throw allPostsError;
      }

      if (!allPosts || allPosts.length === 0) {
        console.log('No posts found');
        setPosts([]);
        return;
      }

      // Only fetch user likes if we have a session
      let likedPostIds = new Set<string>();
      if (session?.user?.id) {
        const { data: userLikes, error: userLikesError } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', session.user.id);

        if (userLikesError) {
          console.error('Error fetching user likes:', userLikesError);
          throw userLikesError;
        }

        likedPostIds = new Set(userLikes?.map(like => like.post_id) || []);
      }

      // Format the posts with like information
      const formattedPosts = allPosts.map(post => ({
        ...post,
        likes: post.likes[0]?.count || 0,
        comments: post.comments[0]?.count || 0,
        liked_by_user: likedPostIds.has(post.id),
        image_urls: post.image_urls || []
      }));

      console.log('Formatted posts:', formattedPosts);
      setPosts(formattedPosts);
    } catch (err) {
      console.error('Error in fetchPosts:', err);
      setError('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initial fetch
    fetchPosts();

    // Set up subscription
    const postsSubscription = supabase
      .channel('posts_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
      }, (payload) => {
        console.log('Received post change:', payload);
        if (mounted) {
          fetchPosts();
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      postsSubscription.unsubscribe();
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const handleImagePick = async () => {
    if (selectedImages.length >= MAX_IMAGES) {
      Alert.alert('Maximum Images', `You can only select up to ${MAX_IMAGES} images`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: MAX_IMAGES - selectedImages.length,
      });

      if (!result.canceled) {
        const newImages = result.assets.filter(asset => {
          // Check file size
          if (asset.fileSize && asset.fileSize > IMAGE_SIZE_LIMIT) {
            Alert.alert('Image too large', 'Please select images under 5MB');
            return false;
          }
          return true;
        }).map(asset => asset.uri);

        setSelectedImages(prev => [...prev, ...newImages].slice(0, MAX_IMAGES));
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!session?.user || (!newPost.trim() && selectedImages.length === 0)) return;

    setIsPosting(true);
    setError('');

    try {
      // First, check if the user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile check error:', profileError);
        throw new Error(`Profile check failed: ${profileError.message}`);
      }

      if (!profile) {
        throw new Error('Please complete your profile before posting');
      }

      let imageUrls = [];

      if (selectedImages.length > 0) {
        // Upload each image to Supabase storage
        for (const imageUri of selectedImages) {
          try {
            // Convert the image URI to a blob
            const response = await fetch(imageUri);
            const blob = await response.blob();
            
            // Generate a unique filename
            const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            
            // Upload to Supabase storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('post-images')
              .upload(filename, blob, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
              });

            if (uploadError) {
              console.error('Error uploading image:', uploadError);
              throw new Error(`Failed to upload image: ${uploadError.message}`);
            }

            // Get the public URL for the uploaded image
            const { data: { publicUrl } } = supabase.storage
              .from('post-images')
              .getPublicUrl(filename);

            imageUrls.push(publicUrl);
          } catch (err) {
            console.error('Error processing image:', err);
            throw new Error('Failed to process image');
          }
        }
      }

      // Create the post with the uploaded image URLs
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: session.user.id,
          content: newPost.trim(),
          image_urls: imageUrls.length > 0 ? imageUrls : null,
        })
        .select()
        .single();

      if (postError) {
        console.error('Post creation error:', postError);
        throw new Error(`Failed to create post: ${postError.message}`);
      }

      setNewPost('');
      setSelectedImages([]);
      fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (post: Post) => {
    if (!session?.user) return;

    try {
      // Optimistically update the UI
      setPosts(currentPosts => 
        currentPosts.map(p => {
          if (p.id === post.id) {
            return {
              ...p,
              likes: p.likes + (p.liked_by_user ? -1 : 1),
              liked_by_user: !p.liked_by_user
            };
          }
          return p;
        })
      );

      if (post.liked_by_user) {
        // Unlike
        const { error: unlikeError } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', session.user.id);

        if (unlikeError) {
          // Revert the optimistic update if there's an error
          setPosts(currentPosts => 
            currentPosts.map(p => {
              if (p.id === post.id) {
                return {
                  ...p,
                  likes: p.likes - 1,
                  liked_by_user: true
                };
              }
              return p;
            })
          );
          throw unlikeError;
        }
      } else {
        // Like
        const { error: likeError } = await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: session.user.id,
          });

        if (likeError) {
          // Revert the optimistic update if there's an error
      setPosts(currentPosts => 
        currentPosts.map(p => {
          if (p.id === post.id) {
            return {
              ...p,
                  likes: p.likes + 1,
                  liked_by_user: false
            };
          }
          return p;
        })
      );
          throw likeError;
        }
      }

      // Fetch the latest data to ensure consistency
      fetchPosts();
    } catch (err) {
      console.error('Error toggling like:', err);
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  const handleComment = async () => {
    if (!session?.user || !selectedPost || !newComment.trim()) return;

    setIsPostingComment(true);

    try {
      const { error: commentError } = await supabase
        .from('comments')
        .insert({
          post_id: selectedPost.id,
          user_id: session.user.id,
          content: newComment.trim(),
        });

      if (commentError) throw commentError;

      setNewComment('');
      fetchComments(selectedPost.id);
      fetchPosts();
    } catch (err) {
      console.error('Error posting comment:', err);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles!comments_user_id_fkey(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;
      setComments(commentsData);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diff = now.getTime() - postDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {session?.user && (
          <View style={styles.createPost}>
            <View style={styles.createPostHeader}>
              <Image
                source={{ 
                  uri: userProfile?.avatar_url || DEFAULT_PROFILE_PIC
                }}
                style={styles.userAvatar}
              />
              <TextInput
                style={styles.postInput}
                placeholder="Share your golf journey..."
                multiline
                value={newPost}
                onChangeText={setNewPost}
                editable={!isPosting}
              />
            </View>

            {selectedImages.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.selectedImagesContainer}
              >
                {selectedImages.map((uri, index) => (
                  <View key={index} style={styles.selectedImageWrapper}>
                    <Image source={{ uri }} style={styles.selectedImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {selectedImages.length < MAX_IMAGES && (
                  <TouchableOpacity 
                    style={styles.addMoreImages}
                    onPress={handleImagePick}
                  >
                    <Plus size={24} color="#2D6A4F" />
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}

            <View style={styles.createPostActions}>
              <TouchableOpacity 
                style={styles.addMediaButton}
                onPress={handleImagePick}
                disabled={isPosting || selectedImages.length >= MAX_IMAGES}
              >
                <ImageIcon size={20} color="#2D6A4F" />
                <Text style={styles.addMediaText}>
                  {selectedImages.length === 0 ? 'Add Photos' : `${selectedImages.length}/${MAX_IMAGES}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.postButton, (!newPost.trim() && selectedImages.length === 0) && styles.postButtonDisabled]}
                onPress={handlePost}
                disabled={isPosting || (!newPost.trim() && selectedImages.length === 0)}
              >
                {isPosting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.postButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {posts.map((post) => (
          <View key={post.id} style={styles.post}>
            <View style={styles.postHeader}>
              <View style={styles.userInfo}>
                <Image 
                  source={{ 
                    uri: post.user?.avatar_url || DEFAULT_PROFILE_PIC
                  }} 
                  style={styles.userAvatar} 
                />
                <View>
                  <Text style={styles.userName}>{post.user?.full_name || 'Unknown User'}</Text>
                  <Text style={styles.userRole}>{post.user?.role === 'coach' ? 'Golf Pro' : 'Student'}</Text>
                </View>
              </View>
              <TouchableOpacity>
                <MoreHorizontal size={24} color="#52796F" />
              </TouchableOpacity>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            {post.image_urls && post.image_urls.length > 0 && (
              <View style={styles.imageGrid}>
                {post.image_urls.slice(0, 4).map((url, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.gridImage,
                      post.image_urls?.length === 1 && styles.singleImage,
                      post.image_urls?.length === 2 && styles.doubleImage,
                      post.image_urls?.length === 3 && index === 0 && styles.tripleMainImage,
                      post.image_urls?.length === 3 && index > 0 && styles.tripleSecondaryImage,
                    ]}
                    onPress={() => {
                      setSelectedImageIndex(index);
                      setShowImageGallery(true);
                    }}
                  >
                    <Image 
                      source={{ uri: url }} 
                      style={styles.gridImageContent} 
                    />
                    {index === 3 && post.image_urls?.length > 4 && (
                      <View style={styles.moreImagesOverlay}>
                        <Text style={styles.moreImagesText}>+{post.image_urls.length - 4}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.postStats}>
              <Text style={styles.statsText}>
                {post.likes} likes • {post.comments} comments
              </Text>
              <Text style={styles.timeAgo}>{formatTimeAgo(post.created_at)}</Text>
            </View>

            <View style={styles.postActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleLike(post)}
              >
                <Heart 
                  size={20} 
                  color={post.liked_by_user ? '#E63946' : '#52796F'}
                  fill={post.liked_by_user ? '#E63946' : 'none'}
                />
                <Text style={styles.actionText}>Like</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  setSelectedPost(post);
                  fetchComments(post.id);
                  setShowComments(true);
                }}
              >
                <MessageCircle size={20} color="#52796F" />
                <Text style={styles.actionText}>Comment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Share2 size={20} color="#52796F" />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={showComments}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowComments(false);
                  setSelectedPost(null);
                  setComments([]);
                  setNewComment('');
                }}
              >
                <X size={24} color="#52796F" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.commentsList}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Image 
                    source={{ 
                      uri: comment.user.avatar_url || DEFAULT_PROFILE_PIC
                    }} 
                    style={styles.commentAvatar} 
                  />
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUserName}>{comment.user.full_name}</Text>
                    <Text style={styles.commentText}>{comment.content}</Text>
                    <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.commentInput}>
              <TextInput
                style={styles.commentTextInput}
                placeholder="Write a comment..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  (!newComment.trim() || isPostingComment) && styles.sendButtonDisabled
                ]}
                onPress={handleComment}
                disabled={!newComment.trim() || isPostingComment}
              >
                {isPostingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showImageGallery}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.galleryOverlay}>
          <TouchableOpacity 
            style={styles.galleryCloseButton}
            onPress={() => setShowImageGallery(false)}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <FlatList
            data={selectedPost?.image_urls || []}
            horizontal
            pagingEnabled
            initialScrollIndex={selectedImageIndex}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.galleryImageContainer}>
                <Image 
                  source={{ uri: item }}
                  style={styles.galleryImage}
                  resizeMode="contain"
                />
              </View>
            )}
            keyExtractor={(_, index) => index.toString()}
          />
          <View style={styles.galleryPagination}>
            <Text style={styles.galleryPaginationText}>
              {selectedImageIndex + 1} / {selectedPost?.image_urls?.length || 0}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 80,
  },
  errorText: {
    color: '#E63946',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  createPost: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  createPostHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2D6A4F',
  },
  postInput: {
    flex: 1,
    height: 80,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1B4332',
  },
  selectedImagesContainer: {
    marginTop: 12,
    paddingBottom: 12,
  },
  selectedImageWrapper: {
    marginRight: 8,
    position: 'relative',
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMoreImages: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E6E6E6',
    borderStyle: 'dashed',
  },
  createPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  addMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  addMediaText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#2D6A4F',
  },
  postButton: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  post: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1B4332',
  },
  userRole: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
  },
  postContent: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1B4332',
    lineHeight: 24,
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginBottom: 12,
  },
  gridImage: {
    width: '49.5%',
    aspectRatio: 1,
    position: 'relative',
  },
  singleImage: {
    width: '100%',
    aspectRatio: 16/9,
  },
  doubleImage: {
    width: '49.5%',
  },
  tripleMainImage: {
    width: '100%',
    marginBottom: 2,
  },
  tripleSecondaryImage: {
    width: '49.5%',
  },
  gridImageContent: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  moreImagesOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  moreImagesText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
  },
  timeAgo: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#52796F',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E6E6E6',
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  actionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#52796F',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  modalTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1B4332',
  },
  commentsList: {
    flex: 1,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#1B4332',
    marginBottom: 4,
  },
  commentText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#1B4332',
    marginBottom: 4,
  },
  commentTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#52796F',
  },
  commentInput: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E6E6E6',
    gap: 12,
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#2D6A4F',
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  galleryOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  galleryCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImageContainer: {
    width: window.innerWidth,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryPagination: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  galleryPaginationText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});