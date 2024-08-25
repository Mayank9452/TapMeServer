// Import necessary libraries
import { createYoga } from 'graphql-yoga';
import { createServer } from 'http';
import { supabase } from './supabaseClient';
import { makeExecutableSchema } from '@graphql-tools/schema';
import TelegramBot from 'node-telegram-bot-api';

// Define type definitions for GraphQL
const typeDefs = `
  type User {
    id: ID!
    coins: Int!
  }

  type Query {
    user(id: ID!): User
    users: [User!]!
  }

  type Mutation {
    addCoins(userId: ID!, amount: Int!): User
  }
`;

// Define resolvers for GraphQL
const resolvers = {
  Query: {
    user: async (_: any, { id }: { id: string }) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching user:', error.message);
          throw new Error('Failed to fetch user');
        }

        return data;
      } catch (error) {
        console.error('Error in user query:', error instanceof Error ? error.message : error);
        throw new Error('Failed to fetch user');
      }
    },

    users: async () => {  // New resolver to fetch all users
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*');

        if (error) {
          console.error('Error fetching users:', error.message);
          throw new Error('Failed to fetch users');
        }

        return data;
      } catch (error) {
        console.error('Error in users query:', error instanceof Error ? error.message : error);
        throw new Error('Failed to fetch users');
      }
    },
  },
  Mutation: {
    addCoins: async (_: any, { userId, amount }: { userId: string, amount: number }) => {
      console.log(`Starting addCoins mutation with userId: ${userId} and amount: ${amount}`);

      try {
        // Fetch the current user data
        const { data: user, error: fetchError } = await supabase
          .from('users')
          .select('coins')
          .eq('id', userId)
          .single();

        if (fetchError) {
          console.error('Error fetching user for update:', fetchError.message);
          throw new Error('Failed to fetch user');
        }

        if (!user) {
          console.error('User not found');
          throw new Error('User not found');
        }

        // Calculate the new balance
        const newBalance = (user.coins || 0) + amount;

        // Update the user's coins
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ coins: newBalance })
          .eq('id', userId)
          .select('*')
          .single();

        if (updateError) {
          console.error('Error updating user coins:', updateError.message);
          throw new Error('Failed to add coins');
        }

        // Return updated user data
        return updatedUser;
      } catch (error) {
        console.error('Error in addCoins mutation:', error instanceof Error ? error.message : error);
        throw new Error('Failed to add coins');
      }
    },
  },
};

// Create an executable schema for GraphQL
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create and start the GraphQL server using Yoga
const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
});
const PORT = process.env.PORT || 4000;
const server = createServer(yoga);
server.listen(PORT, () => {
  console.log(`GraphQL server is running on http://localhost:${PORT}/graphql`);
});

// Initialize the Telegram bot
const bot = new TelegramBot('7375315351:AAGTR76nfRCuHyedyddKV0ZNn0XiPOTq59k', { polling: true });

// Handle the /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id.toString();

  if (!userId) {
    bot.sendMessage(chatId, "Unable to identify user.");
    return;
  }

  try {
    // Check if the user already exists
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);

    if (error) {
      console.error('Error fetching user:', error.message);
      bot.sendMessage(chatId, "Error fetching user data.");
      return;
    }

    if (users.length > 1) {
      console.error('Multiple users found with the same ID:', userId);
      bot.sendMessage(chatId, "Multiple users found with the same ID.");
      return;
    }

    if (users.length === 0) {
      // Create a new user if they don't exist
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ id: userId, coins: 0 }])
        .select('*')
        .single();

      if (insertError) {
        console.error('Error inserting user:', insertError.message);
        bot.sendMessage(chatId, "Error creating user.");
        return;
      }

      bot.sendMessage(chatId, `Welcome to TapMe! You have 0 coins. Click the link to manage your coins: https://tapmeclient.netlify.app/?userId=${userId}`);
    } else {
      const user = users[0];
      bot.sendMessage(chatId, `Welcome back! You have ${user.coins} coins. Click the link to manage your coins: https://tapmeclient.netlify.app/?userId=${userId}`);
    }
  } catch (err) {
    console.error('Error in /start command:', err);
    bot.sendMessage(chatId, "An error occurred while processing your request.");
  }
});

