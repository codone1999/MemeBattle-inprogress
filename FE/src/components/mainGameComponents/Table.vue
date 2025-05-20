<script setup>
import { defineProps, defineEmits } from "vue";
import Card from "./Card.vue";

const props = defineProps({
  currentTurn: {
    type: Number,
    required: true,
  },
  board: {
    type: Array,
    required: true,
  },
});
const emits = defineEmits(["placeCard"]);

// Place a card only on valid spots (give it to GameManager.vue )
const placeCard = (rowIndex, colIndex) => {
  const cell = props.board[rowIndex][colIndex];
  if (typeof cell === "object" && !('pawn1' in cell) && !('pawn2' in cell)) return; // Prevent replacing exist card
  emits("placeCard", rowIndex, colIndex);
};

const getCellClass = (col) => {
  if (col === "blank") return "bg-gray-300";

  if ("scoreP1" in col || "scoreP2" in col) return "bg-yellow-300";

  if ("pawn1" in col && props.currentTurn === 1) return "border-3 border-blue-500";
  if ("pawn2" in col && props.currentTurn === 2) return "border-3 border-red-500";

  if (typeof col === "object" && col.Ability) {
    if (col.abilityType === "buff") {
      return "border-3 border-green-500"
    } else if (col.abilityType === "debuff") {
      return "border-3 border-purple-500"
    }
  }
};

const placeCardSound = '/sounds/se/placecard.mp3';

const playPlaceCard = () => {
    const placesound = new Audio(placeCardSound)
    placesound.volume = 0.3
    placesound.currentTime = 0
    placesound.play().catch(error => console.log("Sound play error:", error))
}
</script>

<template>
  <div class="flex justify-center items-center my-5 max-xl:my-2">
    <div class="border-4 border-gray-700 bg-gray-900 shadow-xl p-1">
      <table class="border-collapse">
        <tbody>
          <tr v-for="(row, rowIndex) in props.board" :key="rowIndex">
            <td
              v-for="(col, colIndex) in row"
              :key="colIndex"
              class="text-center border border-black text-2xl w-32 h-44 
                max-lg:w-16 max-lg:h-22 max-lg:text-sm
                max-xl:w-24 max-xl:h-33 max-xl:text-lg"
              :class="getCellClass(col)"
              @mouseup="playPlaceCard"
              @click="placeCard(rowIndex, colIndex)"
            >
              <span v-if="typeof col === 'object' && 'scoreP1' in col" class="text-blue-500 font-bold">
                {{ col.scoreP1 }}
              </span>
              <span v-if="typeof col === 'object' && 'scoreP2' in col" class="text-red-500 font-bold">
                {{ col.scoreP2 }}
              </span>

              <span v-else-if="col === 'blank'"></span>

              <span v-if="typeof col === 'object' && 'pawn1' in col">
                <span v-for="(v, k) in col.pawn1" :key="k" class="text-blue-400 ">♙</span>
              </span>
              <span v-if="typeof col === 'object' && 'pawn2' in col">
                <span v-for="(v, k) in col.pawn2" :key="k" class="text-red-400">♙</span>
              </span>

              <Card
                v-if="typeof col === 'object' && !('pawn1' in col) && !('pawn2' in col)
                  && !('scoreP1' in col) && !('scoreP2' in col)"
                :title="col.cardname"
                :imageUrl="`/cards/${col.idcard}.png`"
                :score="col.Power"
                :pawnsRequired="col.pawnsRequired"
                :pawnLocations="col.pawnLocations"
                class="scale-55 -mx-13.5 -my-20.5
                  max-xl:scale-40 max-xl:-mx-18 max-xl:-my-27
                  max-lg:scale-25 max-lg:-mx-22 max-lg:-my-34"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>