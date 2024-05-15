import { Request, Response } from "express";
import { omit } from "lodash";
import { ObjectId, Collection } from "mongodb";
import { tryCreate, getPost } from "../utils/posts";

interface Post {
  _id: ObjectId;
  author_id: ObjectId;
  content: string;
  user: object
  // Add more properties as needed
}

interface Context {
  user: {
    _id: string,
  };
  mongo: {
    Post: Collection<Post>,
    User: Collection<any>, // Change `any` to the appropriate type
  };
}
type RequestContext = Request & { context: Context };

export default {
  // GET: /api/posts
  list: async (req: RequestContext, res: Response) => {
    try {
      const { context } = req;
      const { mongo } = context || {};
      const posts = await mongo.Post.find().toArray();

      for (const post of posts) {
        post.user = omit(
          await mongo.User.findOne({
            _id: new ObjectId(post.author_id),
          }),
          ["password"]
        );
      }

      return res.json({
        success: true,
        data: posts,
      });
    } catch (error) {
      console.error(
        "Error occurred while fetching posts from database:",
        error
      );
      throw new Error("Error occurred while fetching posts from database");
    }
  },
  // GET: /api/posts/:id
  view: async (req: RequestContext, res: Response) => {
    try {
      const postId = req.params.id;
      const { context } = req;
      const response = await getPost(postId, context);
      return res.json(response);
    } catch (error: any) {
      console.error(
        "Error occurred while fetching post from database:",
        error.message
      );
      throw new Error("Error occurred while fetching post from database");
    }
  },
  // POST: /api/posts/create
  create: async (req: RequestContext, res: Response) => {
    try {
      const { context } = req;
      const args = req.body;
      const result = await tryCreate(
        {
          content: args.content,
        },
        context
      );
      return res.json(result);
    } catch (error) {
      console.error("Error occurred while creating post:", error);
      throw new Error("Error occurred while creating post");
    }
  },
  // PATCH: /api/posts/:id
  update: async (req: RequestContext, res: Response) => {
    try {
      const { context, body } = req;
      const { mongo } = context;
      const { id } = req.params;

      const response = await getPost(id, context);
      if (!response.success) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      await mongo.Post.updateOne(
        { _id: new ObjectId(id) },
        { $set: { content: body.content } }
      );

      return res.json({
        success: true,
        message: "Updated post successfully",
      });
    } catch (error) {
      console.error("Error occurred while updating post:", error);
      throw new Error("Error occurred while updating post");
    }
  },
  // DELETE: /api/posts/:id
  delete: async (req: RequestContext, res: Response) => {
    try {
      const { context, body } = req;
      const { mongo } = context;
      const { id } = req.params;
      const isValid = ObjectId.isValid(id);
      if (!isValid) {
        return res.status(404).json({
          success: false,
          message: "Id is too long or not valid",
        });
      }
      const response = await getPost(id, context);
      if (!response.success) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }
      const deletedPost = await mongo.Post.findOneAndDelete({
        _id: new ObjectId(id),
      });
      return res.json({
        success: true,
        message: "Deleted post successfully",
      });
    } catch (error) {
      console.error("Error occurred while deleting post:", error);
      throw new Error("Error occurred while deleting post from database");
    }
  },
  likePost: async (req: RequestContext, res: Response) => {
    try {
      const { context, body } = req;
      const { mongo } = context;
      const { id } = req.params;
      const { _id: userId } = context.user;
      const response = await getPost(id, context);
      if (!response.success) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }
      await mongo.Post.updateOne(
        { _id: new ObjectId(id) },
        { $addToSet: { likes: userId } }
      );
      return res.json({
        success: true,
        message: "Liked post successfully",
      });
    } catch (error) {
      console.error("Error occurred while liking post:", error);
      throw new Error("Error occurred while liking post from database");
    }
  },
};
