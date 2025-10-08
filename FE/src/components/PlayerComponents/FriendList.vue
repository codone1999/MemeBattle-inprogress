<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const emit = defineEmits(['requestCount']);

const friends = ref([]);
const friendRequests = ref([]);
const loading = ref(false);
const newFriendUsername = ref('');
const showAddFriend = ref(false);

const onlineFriends = computed(() => 
  friends.value.filter(f => f.is_online === 1)
);

const offlineFriends = computed(() => 
  friends.value.filter(f => f.is_online === 0)
);

const fetchFriends = async () => {
  try {
    const response = await axios.get(`${API_URL}/user/friends`);
    if (response.data.success) {
      friends.value = response.data.data.friends;
    }
  } catch (error) {
    console.error('Failed to fetch friends:', error);
  }
};

const fetchFriendRequests = async () => {
  try {
    const response = await axios.get(`${API_URL}/user/friend-requests`);
    if (response.data.success) {
      friendRequests.value = response.data.data.requests;
      emit('requestCount', friendRequests.value.length);
    }
  } catch (error) {
    console.error('Failed to fetch friend requests:', error);
  }
};

const sendFriendRequest = async () => {
  if (!newFriendUsername.value.trim()) {
    alert('Please enter a username');
    return;
  }

  loading.value = true;
  try {
    const response = await axios.post(`${API_URL}/user/friend-request`, {
      username: newFriendUsername.value.trim()
    });
    
    if (response.data.success) {
      alert('Friend request sent!');
      newFriendUsername.value = '';
      showAddFriend.value = false;
    }
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to send friend request');
  } finally {
    loading.value = false;
  }
};

const acceptFriendRequest = async (requestId) => {
  loading.value = true;
  try {
    await axios.post(`${API_URL}/user/friend-request/${requestId}/accept`);
    alert('Friend request accepted!');
    await fetchFriends();
    await fetchFriendRequests();
  } catch (error) {
    alert('Failed to accept friend request');
  } finally {
    loading.value = false;
  }
};

const removeFriend = async (friendUid, friendName) => {
  if (!confirm(`Remove ${friendName} from friends?`)) return;

  loading.value = true;
  try {
    await axios.delete(`${API_URL}/user/friends/${friendUid}`);
    alert('Friend removed');
    await fetchFriends();
  } catch (error) {
    alert('Failed to remove friend');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchFriends();
  fetchFriendRequests();
  
  // Poll for new requests every 30 seconds
  setInterval(fetchFriendRequests, 30000);
});
</script>

<template>
  <div class="space-y-4 max-h-[600px] overflow-y-auto">
    <!-- Friend Requests -->
    <div v-if="friendRequests.length > 0" class="bg-blue-900/10 border border-blue-500/30 rounded-lg p-4">
      <h4 class="text-blue-400 font-bold mb-3 text-sm">
        Pending Requests ({{ friendRequests.length }})
      </h4>
      <div class="space-y-2">
        <div
          v-for="request in friendRequests"
          :key="request.id"
          class="flex items-center justify-between bg-gray-800 rounded p-3"
        >
          <div>
            <p class="text-white font-semibold text-sm">{{ request.username }}</p>
            <p class="text-gray-400 text-xs">ELO: {{ request.elo_rating }}</p>
          </div>
          <button
            @click="acceptFriendRequest(request.id)"
            :disabled="loading"
            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
          >
            Accept
          </button>
        </div>
      </div>
    </div>

    <!-- Add Friend -->
    <button
      @click="showAddFriend = !showAddFriend"
      class="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded text-sm"
    >
      + Add Friend
    </button>

    <div v-if="showAddFriend" class="bg-gray-800 rounded p-3 space-y-2">
      <input
        v-model="newFriendUsername"
        type="text"
        placeholder="Enter username"
        class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        @keyup.enter="sendFriendRequest"
      />
      <div class="flex gap-2">
        <button
          @click="sendFriendRequest"
          :disabled="loading || !newFriendUsername.trim()"
          class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded text-sm disabled:opacity-50"
        >
          Send
        </button>
        <button
          @click="showAddFriend = false"
          class="px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded text-sm"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- Online Friends -->
    <div v-if="onlineFriends.length > 0">
      <h4 class="text-green-400 font-bold mb-2 text-sm flex items-center gap-2">
        <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        Online ({{ onlineFriends.length }})
      </h4>
      <div class="space-y-2">
        <div
          v-for="friend in onlineFriends"
          :key="friend.uid"
          class="flex items-center justify-between bg-gray-800 hover:bg-gray-700 rounded p-3 group"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gray-900 overflow-hidden border-2 border-green-400">
              <img
                v-if="friend.selected_character"
                :src="`/characters/${friend.selected_character}.png`"
                :alt="friend.username"
                class="w-full h-full object-cover"
              />
            </div>
            <div>
              <p class="text-white font-semibold text-sm">{{ friend.username }}</p>
              <p class="text-gray-400 text-xs">ELO: {{ friend.elo_rating }}</p>
            </div>
          </div>
          <button
            @click="removeFriend(friend.uid, friend.username)"
            class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs"
          >
            Remove
          </button>
        </div>
      </div>
    </div>

    <!-- Offline Friends -->
    <div v-if="offlineFriends.length > 0">
      <h4 class="text-gray-400 font-bold mb-2 text-sm flex items-center gap-2">
        <span class="w-2 h-2 bg-gray-500 rounded-full"></span>
        Offline ({{ offlineFriends.length }})
      </h4>
      <div class="space-y-2">
        <div
          v-for="friend in offlineFriends"
          :key="friend.uid"
          class="flex items-center justify-between bg-gray-800/50 rounded p-3 group"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gray-900 overflow-hidden border-2 border-gray-700 opacity-60">
              <img
                v-if="friend.selected_character"
                :src="`/characters/${friend.selected_character}.png`"
                :alt="friend.username"
                class="w-full h-full object-cover grayscale"
              />
            </div>
            <div>
              <p class="text-gray-300 font-semibold text-sm">{{ friend.username }}</p>
              <p class="text-gray-500 text-xs">ELO: {{ friend.elo_rating }}</p>
            </div>
          </div>
          <button
            @click="removeFriend(friend.uid, friend.username)"
            class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs"
          >
            Remove
          </button>
        </div>
      </div>
    </div>

    <!-- No Friends -->
    <div v-if="friends.length === 0" class="text-center text-gray-400 py-8">
      <p class="text-sm">No friends yet</p>
    </div>
  </div>
</template>