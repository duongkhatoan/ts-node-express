import { ObjectId } from "mongodb";

interface TryCreateArgs {
  content: string;
}

interface TryCreateContext {
  user: {
    _id: string;
  };
  mongo: any; // Replace with the actual type of the mongo object
}

interface TryCreateResponse {
  success: boolean;
  message: string;
}

export const tryCreate = async (args: TryCreateArgs, context: TryCreateContext): Promise<TryCreateResponse> => {
  const { content } = args;
  const { _id: userId } = context.user;
  const { mongo } = context;

  if (!content) {
    return {
      success: false,
      message: "Content is required",
    };
  }

  const newPost = mongo.Post.insertOne({
    content,
    author_id: userId,
    created_at: Date.now(),
    likes: [],
  });

  return {
    success: true,
    message: "Post created successfully",
  };
};

interface GetPostContext {
  mongo: any; // Replace with the actual type of the mongo object
}

interface GetPostResponse {
  success: boolean;
  message?: string;
  data?: any; // Replace with the actual type of the post object
}

export const getPost = async (id: string, context: GetPostContext): Promise<GetPostResponse> => {
  console.log(id);
  const { mongo } = context;
  const post = await mongo.Post.findOne({
    _id: new ObjectId(id),
  });
  console.log(post);
  if (!post) {
    return {
      success: false,
      message: "Post not found",
    };
  }
  return {
    success: true,
    data: post,
  };
};