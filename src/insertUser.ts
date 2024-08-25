// Example script to insert a user
import { supabase } from './supabaseClient';

async function insertUser() {
  const { data, error } = await supabase
    .from('users')
    .insert([{ coins: 200 }]);

  if (error) {
    console.error('Error inserting data:', error);
  } else {
    console.log('Inserted data:', data);
  }
}

insertUser();
