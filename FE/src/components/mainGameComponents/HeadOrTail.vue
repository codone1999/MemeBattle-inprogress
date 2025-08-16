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

        stompClient.subscribe(`/topic/coin-toss/${props.lobbyId}`, (msg) => {
            const payload = JSON.parse(msg.body);
            choices.value = payload.choices;
            tossResult.value = payload.tossResult;
            starterPlayer.value = payload.starterPlayer;

            // Only finalize when both players have chosen and tossResult not yet set
            if (!payload.tossResult && Object.keys(payload.choices).length === 2) {
                finalizeToss();
            }
        });
    };

    stompClient.activate();
}

function publishChoice(choice) {
    if (!stompClient.connected || myChoice.value !== null) return;

    if (choices.value[opponentId.value] === choice) {
        console.error("Opponent already picked that side. Choose the other one.");
        myChoice.value = null;
        canChoose.value = true;
        return;
    }

    myChoice.value = choice;
    canChoose.value = false;

    const newChoices = { ...choices.value, [myUserId.value]: choice };

    stompClient.publish({
        destination: `/app/coin-toss/${props.lobbyId}`,
        body: JSON.stringify({ choices: newChoices })
    });
}

function chooseHead() {
    publishChoice('head');
}

function chooseTail() {
    publishChoice('tail');
}

watch(starterPlayer, (newVal) => {
    if (newVal !== null) {
        emit('playerTurn', newVal);
    }
});
function finalizeToss() {
    // Only finalize when both players have made choices
    if (Object.keys(choices.value).length < 2) return;

    // Simulate a coin flip (random)
    const result = Math.random() < 0.5 ? 'head' : 'tail';
    tossResult.value = result;

    // Decide who wins
    const winnerId = Object.entries(choices.value).find(([playerId, choice]) => choice === result)?.[0];

    starterPlayer.value = Number(winnerId);

    // Notify backend so other player sees the same result
    stompClient.publish({
        destination: `/app/coin-toss/${props.lobbyId}`,
        body: JSON.stringify({
            choices: choices.value,
            tossResult: result,
            starterPlayer: starterPlayer.value
        })
    });

    // Tell parent component (GameManager) who starts
    emit('playerTurn', starterPlayer.value);
}
stompClient.subscribe(`/topic/coin-toss/${props.lobbyId}`, (msg) => {
    const payload = JSON.parse(msg.body);
    choices.value = payload.choices;
    tossResult.value = payload.tossResult;
    starterPlayer.value = payload.starterPlayer;

    // Add this check
    if (!payload.tossResult && Object.keys(payload.choices).length === 2) {
        finalizeToss();
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
