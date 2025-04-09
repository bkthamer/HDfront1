<template>
    <div class="container">
      
      <transition name="fade-slide" appear>
        <header class="page-header">
          <h1>Gestion des Playlists et Points de Diffusion</h1>
          <p class="subtitle">
            Activez vos playlists en un simple glissement !
          </p>
        </header>
      </transition>
  
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <transition name="slide-fade" appear>
          <section class="card">
            <div class="card-header">
              <h2 class="card-title"> Playlists Disponibles</h2>
            </div>
            <div class="card-content">
              <div
                v-for="item in pipData"
                :key="item.playlist.id"
                class="playlist-card p-4 bg-white rounded-lg shadow cursor-move hover:shadow-xl transition duration-200"
                draggable="true"
                @dragstart="onDragStart($event, item.playlist.id)"
              >
                
                <div class="mb-3">
                  <h3 class="text-xl font-bold text-indigo-600 flex items-center">
                    {{ item.playlist.libelle }}
                  </h3>
                  <p class="text-gray-600 text-sm">{{ item.playlist.description }}</p>
                </div>
                
                <div class="mb-3">
                  <h4 class="font-semibold text-gray-700 text-sm">
                    Point de Diffusion :
                  </h4>
                  <p class="text-gray-500 text-xs">
                    {{ item.pdv.pdv_hdref }} - {{ item.pdv.emplacement }}
                  </p>
                </div>
                
                <div class="mb-3">
                  <h4 class="font-semibold text-gray-700 text-sm">
                    Médias ({{ item.medias.length }})
                  </h4>
                  
                  <div class="media-list mt-2">
                    <div
                      v-for="media in paginatedMedias(item)"
                      :key="media.id"
                      class="mb-2"
                    >
                      <Mediacard 
                        :descrip="media.description" 
                        :libe="media.libelle"
                        class="compact" 
                      />
                    </div>
                  </div>
                  
                  <v-pagination
                    v-model="currentPages[item.playlist.id]"
                    :length="totalPages(item)"
                    :total-visible="5"
                    class="pagination mt-2"
                    size="small"
                  />
                </div>
                
                <div class="flex justify-end">
                  <button
                    @click="activatePlaylist(item.playlist.id)"
                    class="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded transition duration-150 text-sm"
                  >
                    Activer Playlist
                  </button>
                </div>
              </div>
            </div>
          </section>
        </transition>
  
        
        <transition name="slide-fade" appear>
          <section class="card">
            <div class="card-header">
              <h2 class="card-title"> Zone d'Activation</h2>
            </div>
            <div class="card-content">
              <div
                class="dropzone h-full border-4 border-dashed border-indigo-400 rounded-lg flex items-center justify-center bg-white hover:bg-indigo-50 transition duration-200"
                @dragover="onDragOver"
                @dragleave="onDragLeave"
                @drop="onDrop"
              >
                <p class="text-indigo-600 text-lg font-bold">
                  {{ dropMessage }}
                </p>
              </div>
            </div>
          </section>
        </transition>
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  import Mediacard from '@/layouts/components/Mediacard.vue'
  import axios from 'axios'
  import { onMounted, ref } from 'vue'
  
  interface Playlist {
    id: number
    libelle: string
    description: string
  }
  
  interface PDV {
    id: number
    pdv_hdref: string
    emplacement: string
  }
  
  interface Media {
    id: number
    libelle: string
    description: string
  }
  
  interface PIPResponse {
    playlist: Playlist
    pdv: PDV
    medias: Media[]
    added_by: string
    added_date: string
  }
  
  const pipData = ref<PIPResponse[]>([])
  const draggedPlaylistId = ref<number | null>(null)
  const dropMessage = ref("Glissez ici la playlist pour l'activer")
  const pageSize = ref(1) 
  const currentPages = ref<Record<number, number>>({}) 
  
  const paginatedMedias = (item: PIPResponse) => {
    const start = (currentPages.value[item.playlist.id] - 1) * pageSize.value
    const end = start + pageSize.value
    return item.medias.slice(start, end)
  }
  
  
  const totalPages = (item: PIPResponse) => {
    return Math.ceil(item.medias.length / pageSize.value)
  }
  
  const fetchPipData = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/pip')
      pipData.value = response.data
      
      pipData.value.forEach(item => {
        currentPages.value[item.playlist.id] = 1
      })
    } catch (error) {
      console.error('Erreur lors de la récupération des données pip', error)
    }
  }
  
  
  const activatePlaylist = async (playlistId: number) => {
    try {
      await axios.get(`http://127.0.0.1:8000/playlist/on/${playlistId}`)
      alert(`Playlist ${playlistId} activée avec succès !`)
    } catch (error) {
      console.error("Erreur lors de l'activation de la playlist", error)
      alert("Erreur lors de l'activation de la playlist")
    }
  }
  
  
  const onDragStart = (event: DragEvent, playlistId: number) => {
    draggedPlaylistId.value = playlistId
    event.dataTransfer?.setData('text/plain', playlistId.toString())
  }
  
  const onDragOver = (event: DragEvent) => {
    event.preventDefault()
    dropMessage.value = 'Relâchez pour activer la playlist'
  }
  
  const onDragLeave = () => {
    dropMessage.value = "Glissez ici la playlist pour l'activer"
  }
  
  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    const playlistIdStr = event.dataTransfer?.getData('text/plain')
    if (playlistIdStr) {
      const playlistId = parseInt(playlistIdStr)
      activatePlaylist(playlistId)
    }
    dropMessage.value = "Glissez ici la playlist pour l'activer"
    draggedPlaylistId.value = null
  }
  
  
  onMounted(fetchPipData)
  </script>
  
  <style scoped>
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 30px 20px;
    background: linear-gradient(135deg, #f0f9ff, #cbebff);
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  
  .page-header {
    text-align: center;
    margin-bottom: 30px;
    animation: headerFade 1s ease-out;
  }
  
  @keyframes headerFade {
    0% { opacity: 0; transform: translateY(-20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  .subtitle {
    font-size: 1.2rem;
    color: #444;
    margin-top: 5px;
  }
  
  
  .card {
    background: #ffffffcc;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    padding: 20px;
  }
  
  .card-header {
    border-bottom: 1px solid #eee;
    margin-bottom: 15px;
  }
  
  .card-title {
    font-size: 1.8rem;
    text-align: center;
    color: #333;
  }
  
  
  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .fade-slide-enter-from,
  .fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-20px);
  }
  
  .slide-fade-enter-active {
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
  .slide-fade-enter-from {
    opacity: 0;
    transform: translateX(-30px);
  }
  
  
  
  .dropzone {
    min-height: 150px;
  }
  
  
  .dropzone:hover,
  .playlist-card:hover {
    transform: translateY(-3px);
  }
  
  
  button {
    cursor: pointer;
  }
  
  
  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  
  
  
  .playlist-card {
    min-height: 400px; 
    display: flex;
    flex-direction: column;
  }
  
  .media-list {
    flex-grow: 1;
    min-height: 120px; 
  }
  
  .compact {
    transform: scale(0.9);
    transform-origin: top left;
    margin: -5px; 
  }
  
  .pagination {
    justify-content: center;
    padding: 8px 0;
  }
  
  .text-xs {
    font-size: 0.75rem;
  }
  
  .text-sm {
    font-size: 0.875rem;
  }
  </style>
  