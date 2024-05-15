import {
  createComment,
  getCommentByPost,
  getCommentsByPost,
} from "../utils/comment";

interface Request {
  context: {
    user: {
      _id: string;
    };
    mongo: any;
  };
  body: {
    post_id: string;
    content: string;
    comment_id: string;
  };
  params: {
    id: string;
  };
}

interface Response {
  json: (data: any) => void;
}

const commentController = {
  // GET: /api/comments
  list: async (req: Request, res: Response) => {
    try {
      const { context } = req;

      const { post_id: postId } = req.body;

      console.log(postId);

      const response = await getCommentsByPost(postId, context);

      return res.json(response);
    } catch (error) {
      console.log(error);
      throw new Error("Error occurred while fetching post from database");
    }
  },
  //   view: async (req, res) => {},
  // POST: /api/comments/create
  create: async (req: Request, res: Response) => {
    try {
      const context = req.context;
      const args = req.body;
      const result = await createComment(
        {
          content: args.content,
          postId: args.post_id,
          commentId: args.comment_id,
        },
        context
      );
      return res.json(result);
    } catch (error) {
      console.log(error);
      throw new Error("Error occurred while creating post");
    }
  },
  //GET: /api/comments/:id
  view: async (req: Request, res: Response) => {
    try {
      const { context } = req;
      const { id: commentId } = req.params;
      const { post_id: postId } = req.body;

      const result = await getCommentByPost(postId, commentId, context);
      return res.json(result);
    } catch (error) {
      console.log(error);
      throw new Error("Error occurred while fetching post from database");
    }
  },
};

export default commentController;