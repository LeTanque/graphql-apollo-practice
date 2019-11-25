const { ApolloServer } = require("apollo-server");
const typeDefs = require("./schema");
const { createStore } = require("./utils");
const resolvers = require("./resolvers");
const isEmail = require("isemail");

const LaunchAPI = require("./datasources/launch");
const UserAPI = require("./datasources/user");

// creates a sequelize connection once. NOT for every request
const store = createStore();



// To add data sources, just create a dataSources property on your ApolloServer
// that corresponds to a function that returns an object with your instantiated data sources.
// set up any dataSources our resolvers need
// Important
// If you use this.context in your datasource,
// it's critical to create a new instance in the dataSources function
// and to not share a single instance. Otherwise, initialize may be called during the
// execution of asynchronous code for a specific user, and replace the this.context by the
// context of another user.
const dataSources = () => ({
  launchAPI: new LaunchAPI(),
  userAPI: new UserAPI({ store })
});
////


////
// This is the ApolloServer instance
// In the context argument key, we're checking the authorization headers on the request, 
// authenticating the user by looking up their credentials in the database, and attaching the user to the context
const server = new ApolloServer({
  context: async ({ req }) => {
    // simple auth check on every request
    const auth = (req.headers && req.headers.authorization) || "";
    const email = Buffer.from(auth, "base64").toString("ascii");

    if (!isEmail.validate(email)) return { user: null };

    // find a user by their email
    const users = await store.users.findOrCreate({ where: { email } });
    const user = (users && users[0]) || null;

    return { 
      user: { 
        ...user.dataValues 
      } 
    };
  },

  typeDefs,
  resolvers,
  dataSources
});
////




server.listen().then(({ url }) => {
  console.log(`\n👾👾👾 >>> ${url}\n`);
});
