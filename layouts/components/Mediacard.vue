<script lang="ts" setup>
import { useRuntimeConfig } from '#imports'
import { onMounted, ref } from 'vue'
import Preview from './Preview.vue'

const props = defineProps({
  descrip: { type: String, required: true },
  libe: { type: String, required: true }
})

const vignetteSrc = ref('')
const showPreview = ref(false)

onMounted(() => {
  const config = useRuntimeConfig()
  vignetteSrc.value = `${import.meta.env.VITE_API_BASE_URL}/mediatheque/vignette/${props.libe}`
})

function openVisualiser() {
  showPreview.value = true
}

function openToplaylist() {
  console.log('Fonction à développer pour affecter le média à une playlist')
}
</script>

<template>
  <v-card class="ucard-media rounded-lg elevation-5">
    <v-img 
      :src="vignetteSrc" 
      alt="Image"
      class="img-media"
      cover
    >
      <template v-slot:default>
        <div class="overlay">
          <v-btn 
            icon="mdi-play-circle"
            color="white"
            variant="text"
            @click="openVisualiser"
            class="play-btn"
          ></v-btn>
        </div>
      </template>
    </v-img>

    <v-card-title class="text-subtitle-1 font-weight-bold">
      {{ libe }}
    </v-card-title>
    
    <v-card-subtitle class="text-body-2 text-grey-darken-1">
      {{ descrip }}
    </v-card-subtitle>

    <v-card-actions class="d-flex justify-space-between">
      
      
    </v-card-actions>
  </v-card>

  <!-- Modal de prévisualisation -->
  <v-dialog v-model="showPreview" max-width="600px">
   
      <Preview :libel="libe" />


  </v-dialog>
</template>

<style scoped>
.ucard-media {
  width: 280px;
  border-radius: 12px;
  overflow: hidden;
}

.img-media {
  width: 100%;
  height: 180px;
  position: relative;
  transition: transform 0.3s ease-in-out;
}

.img-media:hover {
  transform: scale(1.05);
}

.overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.img-media:hover .overlay {
  opacity: 1;
}

.play-btn {
  font-size: 40px;
}
</style>
