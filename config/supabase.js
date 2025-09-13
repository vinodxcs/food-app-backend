const { createClient } = require('@supabase/supabase-js');
// console.log('URL:', process.env.REACT_APP_SUPABASE_URL);
// console.log('Key:', process.env.REACT_APP_SUPABASE_ANON_KEY);
const supabase = createClient('https://lknqixitlxeakgzuzjcx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrbnFpeGl0bHhlYWtnenV6amN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk4Mjc1MSwiZXhwIjoyMDcyNTU4NzUxfQ.SNqrhyoop3s0514ko5Uxzep7i9MqDXCnEJ22xf7ngG4');
module.exports = supabase;

// import { createClient } from '@supabase/supabase-js';
// const supabase = createClient(
//     process.env.REACT_APP_SUPABASE_URL,
//     process.env.REACT_APP_SUPABASE_ANON_KEY
// );

// module.exports = supabase;