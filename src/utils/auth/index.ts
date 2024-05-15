import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { omit } from "lodash";
import { Collection, ObjectId } from "mongodb";

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  deletedAt: Date | null;
}

interface Mongo {
  User: Collection<any>,
}

interface Tokens {
  token: string;
  refreshToken: string;
}

const createTokens = (user: User, remember: boolean): Tokens => {
  const createToken = jwt.sign(
    {
      id: user.id,
    },
    process.env.SECRET_KEY as string,
    {
      expiresIn: remember ? "7d" : "4d",
    }
  );
  const createRefreshToken = jwt.sign(
    {
      id: user.id,
    },
    process.env.REFRESH_KEY as string,
    {
      expiresIn: "7d",
    }
  );

  return { token: createToken, refreshToken: createRefreshToken };
};

export const refreshTokenUser = async (
  token: string,
  refreshToken: string,
  client: any
) => {
  try {
    const _user = jwt.decode(refreshToken) as { id: string } | null;
    if (!_user) {
      return {};
    }

    const user = await client.user.findFirst({ where: { _id: new ObjectId(_user.id) } });

    if (!user) {
      return {};
    }

    const { token: newToken, refreshToken: newRefreshToken } =
      await createTokens(user, true);

    return {
      token: newToken,
      refreshToken: newRefreshToken,
      user,
    };
  } catch (error) {
    return {};
  }
};

const tryLogin = async (args: { username: string; password: string, remember: boolean }, context: { client: any }) => {
  const { username, password, remember } = args || {};

  const { client } = context;

  // validate first
  if (!username || !password) {
    return {
      success: false,
      message: "Invalid username or password",
    };
  }


  // check if user exist with username
  const user = await client.user.findFirst({
    where: {
      OR: [
        { username: username },
        { email: username }
      ],
      deletedAt: { isSet: false }
    }
  });
  console.log(
    { username: username },
  );

  if (!user) {
    return {
      success: false,
      message: "Wrong username or password",
    };
  }

  // check if password match
  const isValidPassword = bcrypt.compareSync(password, user.password);

  if (!isValidPassword) {
    return {
      success: false,
      message: "Wrong username or password",
    };
  }

  //   token generate
  const { token, refreshToken } = createTokens(user, remember);

  console.log(user);

  const updatedUser = await client.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastLoggedInAt: new Date(),
    },
  });

  return {
    success: true,
    user: omit(updatedUser, ["password"]),
    token,
    refreshToken,
  };
};

const tryRegister = async (args: { username: string; password: string, email: string, fullName: string }, context: { client: any }) => {
  const { username, password, email } = args || {};
  const { client } = context;


  const userExist = await client.user.findFirst({
    where: {
      OR: [
        { username: username },
        { email: email }
      ],
      deletedAt: { isSet: false }
    }
  });
  if (userExist) {
    return {
      success: false,
      message: "Username or email already exist",
    };
  }

  //   hashed password
  const hashedPassword = bcrypt.hashSync(password, 12);

  //   storing new user
  const newUser = await client.User.create({
    data: {
      ...args,
      password: hashedPassword,
      // deletedAt: null
    }
  });
  return {
    success: true,
    message: "User created successfully",
  };
};

const hashedPassword = async (password: string) => {
  return bcrypt.hashSync(password, 12);
};


export {
  createTokens,
  tryLogin,
  tryRegister,
  hashedPassword,
}