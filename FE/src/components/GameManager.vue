<script setup>
import { ref, onMounted, computed, watch,onBeforeUnmount } from "vue";
import { getItems, editItem } from "@/lib/fetchUtils";
import { storeToRefs } from 'pinia';
import { useritem } from '@/stores/playerStore.js';
import PlayerCharacter from "./mainGameComponents/PlayerCharacter.vue";
import TableGame from "./mainGameComponents/Table.vue";
import Hand from "./mainGameComponents/Hand.vue";
import HeadOrTail from "./mainGameComponents/HeadOrTail.vue";
import Gacha from "./Gacha.vue";
import PlayerInventory from "./PlayerComponents/PlayerInventory.vue";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let { inventories,currentUser,userInventory,cards,
    decks,characters
 } =storeToRefs(useritem())


const currentTurn = ref(1); // Receive number 1 or 2 for player1 & player2
const round = ref(1);
const selectedCard = ref(null);
const data = ref(null);
const isGameEnd = ref(false) // false by default
const skipsInARow = ref(0); // count how many player skip turn
const showGacha = ref(false); // Add showGacha state
const showPlayerInventory = ref(false)
const movedUp = ref(false)
const gameData = ref(null);
const isCoinTossDone = ref(false); 

const gameProps = defineProps({
  lobbyId: {
    type: Number,
    required: true
  },
    userid: {
    type: Number,
    required: true
  }
})

const board = ref([
 //[{scoreP1: 0}, {pawn1: 1}, "blank", "blank", "blank", "blank", {pawn2: 1}, {scoreP2: 0}],
 //[{scoreP1: 0}, {pawn1: 1}, "blank", "blank", "blank", "blank", {pawn2: 1}, {scoreP2: 0}],
 //[{scoreP1: 0}, {pawn1: 1}, "blank", "blank", "blank", "blank", {pawn2: 1}, {scoreP2: 0}],
]);

const playerDeck = ref(null)
const playerCharacter = ref(null)
let player1Id = ref(null)
let player2Id = ref(null)

onMounted(async () => {
  const res = (`${import.meta.env.VITE_APP_URL}/api/lobby/${gameProps.lobbyId}`);
  gameData.value = await getItems(res);
  console.log("get gamedata")
  console.log(gameData.value)
  player1Id.value = gameData.value.player1Id
  player2Id.value = gameData.value.player2Id
   connectWebSocket();
   getDeck()
   getCharacter()
   initBoard(); // load sample board
});

onBeforeUnmount(() => {
  disconnectWebSocket();
});
console.log(gameData.value)

//const getCurrentPlayerDeckId =()=>{
//  if (gameProps.userid = Number(gameData.value.player1Id)) {
//    return gameData.value.player1DeckId;
//  } else if (gameProps.userid = Number(gameData.value.player2Id)) {
//    return gameData.value.player2DeckId;
//  }
//  return null;
//}
//const getCurrentPlayerCharacterId =()=>{
//  if (gameProps.userid = Number(gameData.value.player1Id)) {
//    return gameData.value.player1CharacterId;
//  } else if (gameProps.userid = Number(gameData.value.player2Id)) {
//    return gameData.value.player2CharacterId;
//  }
//  return null;
//}
const getCurrentPlayerDeckId = () => {
    // Convert both values to numbers for a consistent comparison
    const userId = Number(gameProps.userid);
    const p1Id = Number(gameData.value.player1Id);
    const p2Id = Number(gameData.value.player2Id);

    if (userId === p1Id) {
        return gameData.value.player1DeckId;
    } else if (userId === p2Id) {
        return gameData.value.player2DeckId;
    }
    return null;
};

const getCurrentPlayerCharacterId = () => {
    // Convert both values to numbers for a consistent comparison
    const userId = Number(gameProps.userid);
    const p1Id = Number(gameData.value.player1Id);
    const p2Id = Number(gameData.value.player2Id);

    if (userId === p1Id) {
        return gameData.value.player1CharacterId;
    } else if (userId === p2Id) {
        return gameData.value.player2CharacterId;
    }
    return null;
};

const getDeck = async () => {
  try{
    const deck = `${import.meta.env.VITE_APP_URL}/api/deck/${getCurrentPlayerDeckId()}`;
    playerDeck.value = await getItems(deck);
    //console.log(playerDeck.value);
  } catch (err){
    console.error("Failed to fetch player deck:", err);
  }
};

const getCharacter = async () =>{
  try{
    const character = `${import.meta.env.VITE_APP_URL}/api/character/${getCurrentPlayerCharacterId()}`;
    playerCharacter.value = await getItems(character);
    //console.log(playerCharacter.value);
  } catch (err){
    console.error("Failed to fetch player deck:", err);
  }
}

let stompClient; 

function connectWebSocket() {
  stompClient = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    reconnectDelay: 5000,
    debug: (str) => console.log(str),
  });

  stompClient.onConnect = () => {
    console.log('WebSocket connected');
    // FIXED: use actual lobbyId
    stompClient.subscribe(`/topic/board-update/${gameProps.lobbyId}`, (message) => {
      const data = JSON.parse(message.body);
      board.value = data.board;
      currentTurn.value = data.currentTurn;
    });
  };

  stompClient.activate();
}



function disconnectWebSocket() {
  if (stompClient) stompClient.deactivate();
}

function sendBoardUpdate() {
  const dto = {
    lobbyId: lobbyId,
    board: board.value,
  };

  stompClient.publish({
    destination: '/app/move',
    body: JSON.stringify(dto),
  });
}

function initBoard() {
  board.value = Array(3).fill(null).map(() => ([
    { scoreP1: 0 },
    { pawn1: 1 },
    { isBlank: true },
    { isBlank: true },
    { isBlank: true },
    { isBlank: true },
    { pawn2: 1 },
    { scoreP2: 0 }
  ]));
}

function flipCoin(starterPlayerId) {
    currentTurn.value = starterPlayerId === player1Id.value ? 1 : 2;
    isCoinTossDone.value = true;
}
const playerHands = ref({
  1: [],  // Player 1's hand
  2: [],  // Player 2's hand
});

let deckP1 = [];
let deckP2 = [];
const getPlayerDeck=()=>{
  
}

const toggleMove = () => {
  movedUp.value = !movedUp.value
}

// Add 1 random card to player's hand
const updatePlayerHands = () => {
  if(round.value > 1) {
    const targetDeck = currentTurn.value === 1 ? deckP1 : deckP2;
    getRandomCards(targetDeck, currentTurn.value, 1)
  }

}

const getRandomCards = (deck, addPlayerSide, quantityRandCards) => {
  if(deck.length === 0) return;
  
  // If requesting more cards than card in the deck adjust quantity
  const actualQuantity = Math.min(quantityRandCards, deck.length);
  
  const randomCards = [];
  
  while (randomCards.length < actualQuantity) {
    const randNum = Math.floor(Math.random() * deck.length);
    
    // Check if index is not already selected
    if (!randomCards.includes(randNum)) {
      randomCards.push(randNum);
    }
  }

  // Distribute random card(s) to player
  const selectedRandCards = randomCards.map(num => deck[num]);
  playerHands.value[addPlayerSide].push(...selectedRandCards);

  // Remove already distributed cards in deck
  randomCards.sort((a, b) => b - a); // Sort highest to lowest to prevent index shifting while remove
  for (let index of randomCards) {
    deck.splice(index, 1);
  }
};

// Random 3 cards at begining
const initCardPlayerHands = (player1Deck, player2Deck) => {
  isGameEnd.value = false;
  if (!player1Deck || !player2Deck) return;
  const getPlayerDeck = (deckId) => {
    const deckInfo = data.value?.deck.find((d) => d.deckid === deckId);
    if (!deckInfo) return [];
    return deckInfo.cardid
      .map((cardId) => data.value.card.find((c) => c.idcard === cardId))
      .filter((card) => card !== undefined);
  };
  deckP1 = getPlayerDeck(player1Deck);
  deckP2 = getPlayerDeck(player2Deck);
  getRandomCards(deckP1, 1, 3);
  getRandomCards(deckP2, 2, 3);

  // Check for character 999 and set starting pawns
  if (gameProps.playerCharacter1 === 999) {
    board.value.forEach((row) => {
      if (typeof row[1] === "object") row[1].pawn1 = 3;
    });
  }
  if (gameProps.playerCharacter2 === 999) {
    board.value.forEach((row) => {
      if (typeof row[6] === "object") row[6].pawn2 = 3;
    });
  }
};

// Select a card from Hand (Receive from Hand.vue)
const selectCard = (card) => {
  // console.log(card)
  selectedCard.value = card;
};

// Place a Card on the Board then Remove from Hand (receive from Table.vue)
const placeCard = (rowIndex, colIndex) => {
  const boardSlot = board.value[rowIndex][colIndex];
  const validPawn = `pawn${currentTurn.value}`;

  // Check selectCard not null & pawnsRequired
  if (!selectedCard.value || Number(boardSlot[validPawn]) < Number(selectedCard.value.pawnsRequired)) {
    return;
  }

  if (typeof boardSlot === "object" && validPawn in boardSlot) {
    // Replace card on pawn
    board.value[rowIndex][colIndex] = { ...selectedCard.value, player: currentTurn.value };
    skipsInARow.value = 0;

    // Expand Pawn
    const slot = selectedCard.value.pawnLocations;
    if (slot){
      for(let pawn of slot) {
        cardAbilityOnBoard(rowIndex, colIndex, pawn)
      }
    }
    // Remove the card from the player's hand
    playerHands.value[currentTurn.value] = playerHands.value[currentTurn.value].filter(c => c.id !== selectedCard.value.id);
    // Clear selection after placing
    selectedCard.value = null; 

    changeTurn();
  }
};

// Pawn, Buff and Debuff of card
const cardAbilityOnBoard = (boardRow, boardCol, cardSlot, ability = null) => {
  // Validate inputs
  if (cardSlot < 1 || cardSlot > 25) {
    return;
  }
  if (boardRow < 0 || boardRow >= 3 || boardCol < 0 || boardCol >= 8) {
    return;
  }

  // Grid sizes
  const cardCols = 5;  // 5x5 card grid

  // Convert to 0-based indices
  const cardRow = Math.floor((cardSlot - 1) / cardCols); // ลบ 1 เพราะอัลกอริทึมจับเป็น 0-24 ไม่ใช่ 1-25 หาร 5 เพราะต้องการรู้ row ที่ต้องการวาง card
  const cardCol = (cardSlot - 1) % cardCols; // ลบ 1 เพราะอัลกอริทึมจับเป็น 0-24 ไม่ใช่ 1-25 หาร 5 เพราะต้องการรู้ colume ที่ต้องการวาง card

  // Compute offset from card center (slot 13 is center, index [2,2]) // ความคลาดเคลื่อนจาก slot 13 บน card
  const rowOffset = cardRow - 2; // นับมาจาก 0-2 ดังนั้นตรงนี้คือ index ของ rowOffset
  const colOffset = cardCol - 2; // นับมาจาก 0-2 ดังนั้นตรงนี้คือ index ของ colOffset

  // Calculate final board position ตำแหน่งช่องใน board ที่จะทำการเพิ่ม pawn , buff, debuff
  const finalRow = boardRow + rowOffset;
  const finalCol = boardCol + colOffset;

  // // console.log(`BoardRow: ${boardRow}, BoardCol: ${boardCol}, Card: ${cardSlot} | FRow: ${finalRow}, FColumn: ${finalCol}`)

  // Check boundaries (valid board: 3 rows, 8 columns)
  if (finalRow < 0 || finalRow >= 3 || finalCol < 0 || finalCol >= 8) {
    return
  }

  // Get the current turn's pawn type
  const validPawn = `pawn${currentTurn.value}`;
  const enemyPawn = `pawn${currentTurn.value === 1 ? 2 : 1}`;
  const boardSlot = board.value[finalRow][finalCol];

  // Expand Pawn on board
  if (typeof boardSlot === "object" && validPawn in boardSlot && !ability) {
    boardSlot[validPawn] += 1; // Increase pawn count
  } else if (boardSlot === "blank" && !ability && !boardSlot.enemyPawn) {
    board.value[finalRow][finalCol] = { [validPawn]: 1 }; // Replace a new one if empty
  }
};

const scores = ref({ 1: 0, 2: 0 }); // Store Player 1 & 2 scores

const calculateScore = () => {
  let totalScoreP1 = 0;
  let totalScoreP2 = 0;

  board.value.forEach(row => {
    let rowPowerP1 = 0;
    let rowPowerP2 = 0;

    row.forEach(slot => {
      if (typeof slot === "object" && slot.player) {
        if (slot.player === 1) {
          rowPowerP1 += slot.Power || 0;
        } else if (slot.player === 2) {
          rowPowerP2 += slot.Power || 0;
        }
      }
    });

    // Apply buff and debuff effects
    row.forEach(slot => {
      if (typeof slot === "object" && slot.player && slot.Ability) {

        if (slot.abilityType === "buff") {
          if (slot.player === 1) {
            rowPowerP1 += slot.Power;
          } else if (slot.player === 2) {
            rowPowerP2 += slot.Power;
          }

        } else if (slot.abilityType === "debuff") {
          if (slot.player === 1) {
            rowPowerP2 -= slot.Power;
            if (rowPowerP2 < 0) rowPowerP2 = 0;
          } else if (slot.player === 2) {
            rowPowerP1 -= slot.Power;
            if (rowPowerP1 < 0) rowPowerP1 = 0;
          }
        }
      }
    });

    // Update score in the specific score objects at the beginning and end of the row
    if (typeof row[0] === "object" && row[0].scoreP1 !== undefined) {
      row[0].scoreP1 = rowPowerP1;
    }
    if (typeof row[row.length - 1] === "object" && row[row.length - 1].scoreP2 !== undefined) {
      row[row.length - 1].scoreP2 = rowPowerP2;
    }

    // Determine row winner and add to total score
    if (rowPowerP1 > rowPowerP2) {
      totalScoreP1 += rowPowerP1;
    } else if (rowPowerP2 > rowPowerP1) {
      totalScoreP2 += rowPowerP2;
    }
  });

  // Set total scores
  scores.value[1] = totalScoreP1;
  scores.value[2] = totalScoreP2;

  // Check game end conditions
  const hasPawn = board.value.some(row => 
    row.some(slot => typeof slot === "object" && (slot.pawn1 || slot.pawn2))
  );

  

  const overSkipped = skipsInARow.value > 4;

  if (overSkipped || !hasPawn) {
    isGameEnd.value = true;
    stopMapTheme()
    setTimeout(() => {
      isGameEnd.value = false;
      showGacha.value = true; // Show Gacha when game ends
    }, 5000);
    
    let winnerCharacter = null
    let isDraw = false
    if (scores.value[1] > scores.value[2]) {
      winnerCharacter = gameProps.playerCharacter1
    } else if (scores.value[2] > scores.value[1]) {
      winnerCharacter = gameProps.playerCharacter2
    } else {
      isDraw = true
    }
  
    if (winnerCharacter) {
      winnerSound = playCharacterWinSound(winnerCharacter)
    } else if (isDraw) {
      playDrawSound()
    }
  
    // console.log(`🎉 Game Over! Final Scores → Player 1: ${scores.value[1]}, Player 2: ${scores.value[2]}`)
  }
};

const turnCounter = ref(0);

// Change turn after placeCard
const changeTurn = () => {
  currentTurn.value = currentTurn.value === 1 ? 2 : 1;
  turnCounter.value++; // Count each turn

  if (turnCounter.value % 2 === 0) {
    round.value++; // New round starts
  }

  updatePlayerHands();
  calculateScore();
};

const skipTurn = () => {
  skipsInARow.value++; // Increment skips

  changeTurn();
  selectedCard.value = null; // Clear any selected card when skipping
};
const playHoverButton = () => {
    hoverBtnSound.currentTime = 0
    hoverBtnSound.play()//.catch(error => console.log("Sound play error:", error))
}

const playCharacterWinSound = (characterId) => {
  if (!characterId) {
    console.error("Character ID not found!")
    return;
  }

  const soundPath = `/sounds/charactersounds/${characterId}.mp3`
  const audio = new Audio(soundPath)
  audio.volume = 0.1
  audio.play()

  return audio
};

const stopWinnerSound = () => {
  if (winnerSound.value) {
    // console.log("Stopping map theme...")
    winnerSound.value.pause();
    winnerSound.value.currentTime = 0
    winnerSound.value = null
  } else {
    // console.log("No audio to stop")
  }
}

const playDrawSound = () => {
  const soundPath = "/sounds/charactersounds/draw.mp3"
  const audio = new Audio(soundPath);
  audio.volume = 0.1
  audio.play();
}

const mapThemeAudio = ref(null)

const playMapTheme = () => {
  if (!gameProps.selectedMap) {
    console.error("No map selected!")
    return
  }

  let mapName = gameProps.selectedMap.split('/').at(-1)
  if (mapName.includes('.')) {
    mapName = mapName.split('.')[0]
  }

  const themePath = `/sounds/mapthemes/${mapName}.mp3`
  // console.log("🎵 Theme Path:", themePath)

  if (mapThemeAudio.value) {
    mapThemeAudio.value.pause()
    mapThemeAudio.value = null
  }

  mapThemeAudio.value = new Audio(themePath)
  mapThemeAudio.value.loop = true;
  mapThemeAudio.value.volume = gameProps.masterVolume / 100;
  mapThemeAudio.value.play().catch(error => {
    console.error("🔇 Audio Play Error:", error)
  })
}

const stopMapTheme = () => {
  if (mapThemeAudio.value) {
    // console.log("Stopping map theme...")
    mapThemeAudio.value.pause();
    mapThemeAudio.value.currentTime = 0
    mapThemeAudio.value = null
  } else {
    // console.log("No audio to stop")
  }
};
const closeGacha = () => {
  showGacha.value = false;
  showPlayerInventory.value = true;
}
watch(() => gameProps.seVolume, (newSeVolume) => {
    // console.log('GameManager received seVolume from Store:', newSeVolume);
    updateAllSoundVolumes(gameProps.masterVolume, newSeVolume); // ส่งทั้งสองค่า
});

watch(() => gameProps.masterVolume, (newMasterVolume) => {
    // console.log('GameManager received masterVolume from Store:', newMasterVolume);
    updateAllSoundVolumes(newMasterVolume, gameProps.seVolume); // ส่งทั้งสองค่า
});

const updateAllSoundVolumes = (volume) => {
  if (mapThemeAudio.value) {
    mapThemeAudio.value.volume = volume / 100; // ปรับตาม masterVolume
  }
  hoverBtnSound.volume = volume / 100;
  // ปรับเสียงอื่นๆ ใน GameManager ตามต้องการ
};

</script>

<template>
  <template v-if="gameData">
    <HeadOrTail 
      :lobbyId="gameProps.lobbyId" 
      :userid="gameProps.userid" 
      :player1Id="player1Id" 
      :player2Id="player2Id"
      @playerTurn="flipCoin"
    />
    <div v-if="isCoinTossDone && !showPlayerInventory">
    <img
      :src="selectedMap"
      alt="background"
      class="fixed w-screen h-screen"
    />

    <div class="flex flex-col items-center -mt-12 z-10 overflow-hidden max-xl:-mt-14">
      <div class="text-2xl font-bold max-xl:text-lg max-md:text-sm">
        <span>Round: {{ round }}</span>
        <span class="ml-4" :class="currentTurn === 1 ? 'text-blue-500' : 'text-red-500'">
          Player {{ currentTurn }}'s Turn
        </span>
      </div>

      <div class="flex gap-15 items-center justify-center max-xl:gap-0">
        <!-- Left Player -->
        <PlayerCharacter
          :selectId="gameProps.playerCharacter1"
        >
        </PlayerCharacter>

        <TableGame :currentTurn="currentTurn" :board="board" @placeCard="placeCard" />

        <!-- Right Player -->
        <PlayerCharacter 
          :selectId="gameProps.playerCharacter2"
        >
        </PlayerCharacter>
      </div>

      <button
        @click="toggleMove()"
        class="flex justify-center items-center mb-4 w-3/5 py-4 border-2 bg-gray-600/70 text-gray-300 rounded z-20 transition-all duration-300 hover:bg-gray-600/85 
        origin-bottom max-xl:scale-y-50 max-lg:-mt-10 max-md:scale-y-40 max-md:-mt-10 2xl:hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 20"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          class="w-full h-6"
        >
          <polyline points="5,5 50,15 95,5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div :class="['flex gap-10 items-center justify-center transition-all duration-300 w-3/5 origin-bottom max-xl:scale-70 max-lg:scale-60 max-lg:gap-0 max-md:scale-50 z-10', 
        movedUp ? '-mt-110 mb-10 bg-gray-800/60 rounded-3xl' : '-mt-10 max-2xl:mt-100']"
      >
        <Hand v-if="currentTurn === 1" :player="1" :currentTurn="currentTurn" :hand="playerHands[1]" @selectCard="selectCard" />
        <Hand v-if="currentTurn === 2" :player="2" :currentTurn="currentTurn" :hand="playerHands[2]" @selectCard="selectCard" />
        <div class="flex flex-col items-center">
          <button
            class="bg-red-900 hover:bg-red-800 text-white font-bold p-5 rounded-3xl border-4 border-black z-10"
            @mouseenter="playHoverButton"
            @click="skipTurn"
          >
            {{ skipsInARow < 4 ? 'Skip Turn' : 'Surrender' }}
          </button>
          <p
            v-if="skipsInARow < 4" 
            class="font-bold text-red-400"
          >
            Remain: {{ 4 - skipsInARow }}
          </p>
        </div>
      </div>
    </div>

    <!-- END GAME -->
    <div
      v-if="isGameEnd"
      class="fixed inset-0 flex flex-col gap-5 justify-center items-center z-50 w-screen h-screen bg-gray-800/90 text-2xl font-bold text-center"
    >
      <p v-if="scores[1] > scores[2]" class="text-green-500 text-4xl mt-5">🏆 Player 1 Wins!</p>
      <PlayerCharacter
        v-if="scores[1] > scores[2]"
        :selectId="gameProps.playerCharacter1"
      >
      </PlayerCharacter>

      <p v-if="scores[2] > scores[1]" class="text-green-500 text-4xl mt-5">🏆 Player 2 Wins!</p>
      <PlayerCharacter
        v-if="scores[2] > scores[1]"
        :selectId="gameProps.playerCharacter2"
      >
      </PlayerCharacter>

      <p v-if="scores[2] === scores[1]" class="text-gray-400 text-4xl my-5">It's a Tie!</p>
      <div
        v-if="scores[2] === scores[1]"
        class="flex justify-center items-center gap-5 mb-5"
      >
        <PlayerCharacter
          :selectId="gameProps.playerCharacter1"
        >
        </PlayerCharacter>

        <span class="text-gray-400 text-9xl">🤝</span>

        <PlayerCharacter
          :selectId="gameProps.playerCharacter2"
        >
        </PlayerCharacter>
      </div>

      <div>
        <p class="text-blue-500">Player 1 Score: {{ scores[1] }}</p>
        <p class="text-red-500">Player 2 Score: {{ scores[2] }}</p>
      </div>
    </div>
  </div>
  </template>

</template>
