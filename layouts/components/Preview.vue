<script lang="ts" setup>
import { useRuntimeConfig } from '#imports'
import { onMounted, ref } from 'vue'

const props = defineProps({
  libel: {
    type: String,
    default: 'defaut'
  }
})

// Initialisation du modal ouvert dès le chargement
const isOpen = ref(true)
const videoSrc = ref('')

onMounted(() => {
  const config = useRuntimeConfig()
  videoSrc.value = `http://127.0.0.1:8000/mediatheque/video/${props.libel}`
  console.log("URL de la vidéo :", videoSrc.value)
})
</script>

<template>
  <v-dialog v-model="isOpen" max-width="600px">
    <v-card class="ucard-modal pa-4">
      <video autoplay loop controls muted playsinline class="video-player">
        <source :src="videoSrc" type="video/mp4" />
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>

    </v-card>
  </v-dialog>
</template>

<style scoped>
.ucard-modal {
  width: 500px;
}

.video-player {
  width: 100%;
  border-radius: 8px;
}
</style>
