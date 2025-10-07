<script setup>
const userprop = defineProps({
    users:{
        type:Array,
        require:true,
        validator: (value) => {
            return (
                typeof value.username === 'string' &&
                typeof value.uid === 'number' &&
                value.username !== null && value.username !== ''
            );
        }
    }
})
</script>

<template>
</template>

<style scoped></style>