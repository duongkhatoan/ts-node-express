import { ObjectId, Collection } from "mongodb";
import { getPost } from "../posts";

interface Comment {
  _id?: ObjectId;
  parent_id: ObjectId | null;
  post_id: ObjectId;
  user_id: ObjectId;
  content: string;
  created_at: Date;
  deleted_at: Date | null;
  likes: any[]; // Change to the appropriate type
  replies?: Comment[];
  depth?: number;
}

interface Context {
  user: {
    _id: string;
  };
  mongo: any;
}

export const getCommentsByPost = async (id: string, context: Context) => {
  try {
    console.log(id);
    const { mongo } = context;
    // get comment and reply if exists, display like trees structure
    const comments = await mongo.Comment.find({
      post_id: new ObjectId(id),
    }).toArray();

    console.log(comments);

    // get all comments and filter and set depth for comments
    const oldComments = comments;

    const commentsWithParent = oldComments.filter(
      (comment) => comment.parent_id
    );

    // GET comments dont have parent_id
    const commentsNoParent = oldComments.filter(
      (comment) => !comment.parent_id
    );
    for (const commentChild of commentsNoParent) {
      commentChild.replies = buildCommentTree(commentChild, commentsWithParent);
    }

    return commentsNoParent;
  } catch (error) {
    console.error("Error fetching comments:", error);
    // Throw the error instead of returning a response
    throw new Error("Internal server error");
  }
};

export const createComment = async (args: { content: string; postId: string; commentId?: string; }, context: Context) => {
  try {
    const { content, postId } = args;

    let { commentId: parent_id } = args;
    const { _id: userId } = context.user;
    const { mongo } = context;

    if (!content || !postId) {
      throw new Error("Content is required and postID is required");
    }

    // validate postID first

    const response = await getPost(postId, context);
    if (!response.success) {
      throw new Error("Post not found");
    }

    // validate if have commentId
    let parent_id_obj: ObjectId | null = null;
    if (parent_id && parent_id !== "undefined") {
      const parentComment = await mongo.Comment.findOne({
        _id: new ObjectId(parent_id),
        post_id: new ObjectId(postId),
      });
      if (!parentComment) {
        throw new Error("Parent comment not found");
      }
      //   console.log(parentComment);
      // parent_id = new ObjectId(parent_id);
    }

    const newComment = await mongo.Comment.insertOne({
      post_id: new ObjectId(postId),
      user_id: new ObjectId(userId),
      content: content,
      created_at: new Date(),
      deleted_at: null,
      likes: [],
      parent_id: parent_id ? new ObjectId(parent_id) : null || null, // Simplified assignment
    });

    return {
      success: true,
      message: "Comment created successfully",
    };
  } catch (error) {
    console.error("Error creating comment:", error);
    // Throw the error instead of returning an object
    throw new Error("Internal server error");
  }
};

export const getCommentByPost = async (postId: string, id: string, context: Context) => {
  try {
    const { mongo } = context;

    // Find comments first

    const comment = await mongo.Comment.findOne({
      _id: new ObjectId(id),
      post_id: new ObjectId(postId),
    });
    if (!comment) {
      throw new Error("Comment not found");
    }
    // console.log(context);
    const result = await buildCommentTree(comment, mongo);
    return { ...comment, result };
  } catch (error) {
    console.error("Error fetching comments:", error);
    // Throw the error instead of returning a response
    throw new Error("Internal server error");
  }
};

// Build function can get comment child -- recursive function
export const buildCommentTree = (comment: Comment, oldComments: Comment[], currentDepth = 0): Comment[] => {
  const filterChildComments = oldComments.filter((child) => {
    if (child.parent_id === null) {
      return;
    }
    return child.parent_id.equals(comment._id);
  });

  if (filterChildComments.length > 0) {
    for (const reply of filterChildComments) {
      reply.depth = currentDepth;
      reply.replies = buildCommentTree(reply, oldComments, currentDepth + 1);
    }
  }
  return filterChildComments;
};
