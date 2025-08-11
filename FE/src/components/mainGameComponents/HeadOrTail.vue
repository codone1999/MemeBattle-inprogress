<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const emit = defineEmits(['playerTurn']);
const props = defineProps({
    lobbyId: Number,
    userid: Number,
    player1Id: Number,
    player2Id: Number
});

const choices = ref({}); // Store choices: { player1Id: 'head', player2Id: 'tail' }
const tossResult = ref(null);
const starterPlayer = ref(null);
const canChoose = ref(true); // Both players can choose initially
const myChoice = ref(null);

// Computed properties for robust type handling and player identification
const myUserId = computed(() => Number(props.userid));
const player1AsNumber = computed(() => Number(props.player1Id));
const player2AsNumber = computed(() => Number(props.player2Id));

// Opponent ID is derived from the current player's ID
const opponentId = computed(() => {
    return myUserId.value === player1AsNumber.value ? player2AsNumber.value : player1AsNumber.value;
});

let stompClient;

onMounted(() => {
    connectWebSocket();
});

function connectWebSocket() {
    stompClient = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        reconnectDelay: 5000,
        debug: (str) => console.log('[HeadOrTail WS]', str),
    });

    stompClient.onConnect = () => {
        console.log("HeadOrTail connected");
        // Subscribe to coin-toss updates for this lobby
        stompClient.subscribe(`/topic/coin-toss/${props.lobbyId}`, (msg) => {
            const payload = JSON.parse(msg.body);
            // Update local state with incoming data
            choices.value = payload.choices;
            tossResult.value = payload.tossResult;
            starterPlayer.value = payload.starterPlayer;
        });
    };
    stompClient.activate();
}

function publishChoice(choice) {
    // Prevent publishing if not connected or if a choice has already been made
    if (!stompClient.connected || myChoice.value !== null) return; 

    // Check if the opponent has already picked the same choice
    if (choices.value[opponentId.value] === choice) {
        console.error("Opponent has already picked that side. Please choose the other one.");
        // Reset myChoice and allow choosing again
        myChoice.value = null; 
        canChoose.value = true;
        return;
    }

    // Set my local choice and disable further choices for this player
    myChoice.value = choice;
    canChoose.value = false;

    // Create a new choices object by merging current choices with my new choice
    const newChoices = { ...choices.value, [myUserId.value]: choice };
    const message = { choices: newChoices };

    // ⭐ This block executes ONLY when both players have made their initial choice
    if (newChoices[player1AsNumber.value] && newChoices[player2AsNumber.value]) {
        const toss = Math.random() < 0.5 ? 'head' : 'tail'; // Randomize the toss result
        const myFinalChoice = newChoices[myUserId.value]; // Get my confirmed choice from the consolidated object

        // Determine who starts the game based on the toss result and chosen side
        const starter = toss === myFinalChoice ? myUserId.value : opponentId.value;
        
        message.tossResult = toss;
        message.starterPlayer = starter;
    }

    // Publish the updated choices (and toss result if applicable) to the server
    stompClient.publish({
        destination: `/app/coin-toss/${props.lobbyId}`,
        body: JSON.stringify(message)
    });
}

function chooseHead() {
    publishChoice('head');
}

function chooseTail() {
    publishChoice('tail');
}

// Watch for the starterPlayer to be determined and then emit the event to GameManager
watch(starterPlayer, (newVal) => {
    if (newVal !== null) { // Ensure a valid starterPlayer ID is received
        emit('playerTurn', newVal); // Emit the winning player's ID
    }
});
</script>

<template>
    <div class="coin-toss-container flex flex-col justify-center items-center h-screen bg-gray-900/90 text-white p-4">
        <h2 class="text-4xl font-bold mb-8">Coin Toss</h2>

        <div v-if="tossResult === null" class="text-center space-y-4">
            <h3 class="text-2xl mb-4">
                <!-- Dynamically display current player identification -->
                {{ myChoice !== null ? `Waiting for Opponent...` : `Player ${myUserId === player1AsNumber ? 1 : 2}, pick a side!` }}
            </h3>

            <div v-if="myChoice === null" class="flex justify-center gap-8">
                <button 
                  @click="chooseHead" 
                  :disabled="!canChoose || choices[opponentId.value] === 'head'" 
                  class="px-8 py-4 text-2xl font-semibold bg-blue-600 rounded-full hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
                >
                    Head
                </button>
                <button 
                  @click="chooseTail" 
                  :disabled="!canChoose || choices[opponentId.value] === 'tail'" 
                  class="px-8 py-4 text-2xl font-semibold bg-red-600 rounded-full hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
                >
                    Tail
                </button>
            </div>
            <!-- Display opponent's choice if available -->
            <p v-if="choices[opponentId.value]" class="mt-4 text-lg text-gray-400">
              Opponent has picked {{ choices[opponentId.value] === 'head' ? 'Tail' : 'Head' }}.
            </p>
        </div>

        <div v-else class="text-center space-y-4">
            <p class="text-2xl">You picked: <strong class="text-blue-400">{{ myChoice }}</strong></p>
            <p class="text-2xl">Opponent picked: <strong class="text-red-400">{{ choices[opponentId.value] }}</strong></p>
            <p class="text-4xl font-bold my-6">Coin Toss Result: <span class="text-yellow-400">{{ tossResult }}</span></p>

            <div v-if="starterPlayer === myUserId.value" class="text-green-400 text-5xl font-extrabold mt-8">
                🎉 You won the toss and start first!
            </div>
            <div v-else class="text-red-400 text-5xl font-extrabold mt-8">
                Opponent won. They start first.
            </div>
        </div>
    </div>
</template>

<style scoped>
.coin-toss-container {
    user-select: none;
}
</style>
