<template>
  <div class="container">
    
    <transition name="fade-slide" appear>
      <header class="page-header">
        <h1>Gestion des Hélices</h1>
        <p class="subtitle">
          Contrôlez facilement vos hélices et gérez leurs médias depuis cette interface.
        </p>
        <div class="status">
          <span
            v-if="pingStatus !== null"
            class="status-indicator"
            :class="{ online: pingStatus, offline: !pingStatus }"
          ></span>
          <span class="status-text">
            {{ pingStatus === null ? '' : (pingStatus ? 'Connecté' : 'Non connecté') }}
          </span>
        </div>
      </header>
    </transition>

    <transition name="slide-fade" appear>
      <section class="helice-section">
        <div class="select-container">
          <v-select
            v-model="selectedHelice"
            :items="matOptions"
            item-text="hdref"
            item-value="hdref"
            placeholder="Sélectionner une hélice"
            outlined
          />
        </div>
        <div class="actions-container">
          <div class="debug-btn">
            <VBtn @click="handleButtonClick" color="blue">Debug Console</VBtn>
          </div>
          <!-- Bouton pour restaurer les médias précédents -->
          <div class="restore-btn">
            <VBtn 
  @click="selectedHelice && restorePreviousMedias(selectedHelice)" 
  color="success"
  :disabled="!selectedHelice"
>
  Restaurer Médias Précédents
</VBtn>

          </div>
        </div>
      </section>
    </transition>

    <transition name="slide-fade" appear>
      <section class="command-section">
        <h2>Commandes Hélice</h2>
        <div class="command-buttons">
          <VBtn @click="cmdVeille" color="secondary">Mettre en veille</VBtn>
          <VBtn @click="cmdStart" color="secondary">Sortie de veille</VBtn>
          <VBtn @click="cmdInfo" color="secondary">Info</VBtn>
          <VBtn @click="cmdReload" color="secondary">Reload Media SD</VBtn>
          <VBtn @click="cmdListsd" color="secondary">Liste SD</VBtn>
        </div>
        <div class="command-response">
          <strong>Retour des commandes :</strong>
          <span>{{ retour }}</span>
        </div>
      </section>
    </transition>

    <transition name="slide-fade" appear>
      <section class="media-section">
        <h2>Gestion des Médias</h2>
        <VBtn @click="cmdListsd" color="primary" class="refresh-btn">Actualiser la liste SD</VBtn>
 
        <div class="media-management">
          <div class="add-media media-card">
            <h3>Ajouter un Média</h3>
            <div class="media-available">
              <div class="media-list">
                <div
                  v-for="media in paginatedMediaOptions"
                  :key="media.libelle"
                  class="media-item"
                  draggable="true"
                  @dragstart="onDragStart($event, media)"
                >
                  <Mediacard :descrip="media.description" :libe="media.libelle" />
                </div>
              </div>
              <v-pagination
                v-model="currentPage"
                :length="totalPages"
                class="pagination"
              />
            </div>
            <div class="drop-zone">
              <div
                class="drop-zone-inner"
                @dragover.prevent="dragOver = true"
                @dragleave="dragOver = false"
                @drop="onDrop"
                :class="{ 'drag-over': dragOver }"
              >
                <div v-if="!selectedMedia" class="drop-instructions">
                  Déposer le média ici
                </div>
                <div v-else class="selected-media">
                  <Mediacard :descrip="selectedMedia.description" :libe="selectedMedia.libelle" />
                </div>
              </div>
              <VBtn 
                @click="cmdaddfile" 
                color="primary" 
                :disabled="!selectedMedia"
                class="action-btn"
              >
                Ajouter le média
              </VBtn>
            </div>
          </div>

          <div class="delete-media media-card">
            <h3>Supprimer un Média</h3>
            <div class="media-to-delete">
              <div class="media-list">
                <div
                  v-for="file in paginatedDeletionOptions"
                  :key="file"
                  class="media-item"
                  draggable="true"
                  @dragstart="onDragStartDel($event, file)"
                >
                  <Mediacard :descrip="cleanFileName(file)" :libe="cleanFileName(file)" />
                </div>
              </div>
              <v-pagination
                v-model="currentPageDel"
                :length="totalPagesDel"
                class="pagination"
              />
            </div>
            <div class="drop-zone">
              <div
                class="drop-zone-inner"
                @dragover.prevent="dragOverDel = true"
                @dragleave="dragOverDel = false"
                @drop="onDropDel"
                :class="{ 'drag-over': dragOverDel }"
              >
                <div v-if="!selectedMediaDel" class="drop-instructions">
                  Déposer le média ici pour suppression
                </div>
                <div v-else class="selected-media">
                  <Mediacard :descrip="cleanFileName(selectedMediaDel)" :libe="cleanFileName(selectedMediaDel)" />
                </div>
              </div>
              <VBtn 
                @click="cmddelfile" 
                color="error" 
                :disabled="!selectedMediaDel"
                class="action-btn"
              >
                Supprimer le média
              </VBtn>
            </div>
          </div>
        </div>
      </section>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useLazyAsyncData } from '#imports'
import Mediacard from '@/layouts/components/Mediacard.vue'
import { computed, onMounted, ref, watch } from 'vue'

// Interfaces
interface Materiel {
  materiel_hdref: string
}
interface Media {
  description: string
  libelle: string
  owner_id: number | null;
}
interface User {
  email: string;
  role: string;
  site_id: string;
  id_user?: number;
}

const user = ref<User>({ email: 'Unknown', role: 'User', site_id: '0', id_user: undefined })
const materiels = ref<Materiel[]>([])
const selectedHelice = ref<string | null>(null)
const selectedMedia = ref<Media | null>(null)
const selectedMediaDel = ref<string | null>(null)
const retour = ref<string>('') 
const retoursd = ref<string[]>([])
const pingStatus = ref<boolean | null>(null)
const dragOver = ref(false)
const dragOverDel = ref(false)

const currentPage = ref(1)
const pageSize = ref(1)
const medias = ref<Media[]>([])
const filteredMedias = ref<Media[]>([])
const totalPages = computed(() => Math.ceil(filteredMedias.value.length / pageSize.value))
const paginatedMediaOptions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredMedias.value.slice(start, start + pageSize.value)
})

const currentPageDel = ref(1)
const pageSizeDel = ref(1)
const totalPagesDel = computed(() => Math.ceil(retoursd.value.length / pageSizeDel.value))
const paginatedDeletionOptions = computed(() => {
  const start = (currentPageDel.value - 1) * pageSizeDel.value
  return retoursd.value.slice(start, start + pageSizeDel.value)
})

const { data: heliceop_list } = await useLazyAsyncData('heliceop_list', () =>
  $fetch('http://127.0.0.1:8000/helices/op/list')
)

const fetchMedias = async () => {
  try {
    const { data } = await useLazyAsyncData<Media[]>('medias', () =>
      $fetch('http://127.0.0.1:8000/mediatheque/list')
    )
    if (data.value) {
      medias.value = data.value
      filterMedias()
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des médias:', error)
  }
}

const filterMedias = () => {
  if (user.value.role === 'Admin') {
    filteredMedias.value = medias.value
  } else {
    filteredMedias.value = medias.value.filter(media =>
      media.owner_id === null || media.owner_id === user.value.id_user
    )
  }
}

const fetchUser = async () => {
  const token = localStorage.getItem('authToken')
  if (token) {
    try {
      const payloadBase64 = token.split('.')[1]
      const decodedPayload = JSON.parse(atob(payloadBase64))
      user.value.email = decodedPayload.sub || 'Unknown'
      user.value.role = decodedPayload.role || 'User'
      user.value.site_id = decodedPayload.site_id || '0'
      await fetchUserId()
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error)
    }
  }
}

const fetchUserId = async () => {
  try {
    const response = await $fetch<{ user_id: number }>('http://127.0.0.1:8000/get_user_id', {
      method: 'POST',
      body: { email: user.value.email },
    })
    user.value.id_user = response.user_id
  } catch (error) {
    console.error('Erreur lors de la récupération de l’ID utilisateur:', error)
  }
}

const fetchMaterielsBySite = async () => {
  try {
    const response = await $fetch(`http://127.0.0.1:8000/pdv/list/bysite/${user.value.site_id}`)
    materiels.value = response as Materiel[]
  } catch (error) {
    console.error('Erreur récupération matériels:', error)
  }
}

const checkMaterielStatus = async () => {
  if (!selectedHelice.value) return
  try {
    const ipResponse = await $fetch<{ ip: string }>('http://127.0.0.1:8000/get_ip', {
      method: 'POST',
      body: { hdref: selectedHelice.value }
    })
    const pingResponse = await $fetch<{ success: boolean }>('http://127.0.0.1:8000/ping', {
      method: 'POST',
      body: { ip_address: ipResponse.ip }
    })
    pingStatus.value = pingResponse.success
  } catch (error) {
    pingStatus.value = false
  }
}

const cleanFileName = (file: string): string => file.replace('Z3.mp4', '')

const onDragStart = (event: DragEvent, media: Media) => {
  event.dataTransfer?.setData('text/plain', JSON.stringify(media))
}
const onDrop = (event: DragEvent) => {
  dragOver.value = false
  const mediaData = event.dataTransfer?.getData('text/plain')
  selectedMedia.value = mediaData ? JSON.parse(mediaData) : null
}

const onDragStartDel = (event: DragEvent, file: string) => {
  event.dataTransfer?.setData('text/plain', JSON.stringify(file))
}
const onDropDel = (event: DragEvent) => {
  dragOverDel.value = false
  const fileData = event.dataTransfer?.getData('text/plain')
  selectedMediaDel.value = fileData ? JSON.parse(fileData) : null
}

const sendCommand = async (ordre: string, parametres?: Record<string, any>) => {
  try {
    const response = await $fetch('http://127.0.0.1:8000/helice/remote', {
      method: 'POST',
      body: { hdref: selectedHelice.value, ordre, ...parametres }
    })
    return response
  } catch (error) {
    console.error(`Erreur commande ${ordre}:`, error)
    return 'Erreur lors de l\'exécution'
  }
}

const cmdVeille = async () => {
  retour.value = await sendCommand('veille') as string
}
const cmdStart = async () => {
  retour.value = await sendCommand('start') as string
}
const cmdInfo = async () => {
  retour.value = await sendCommand('info') as string
}
const cmdReload = async () => {
  retour.value = await sendCommand('reload') as string
}
const cmdListsd = async () => {
  retoursd.value = await sendCommand('listsd') as string[]
}
const cmdaddfile = async () => {
  if (selectedMedia.value) {
    retour.value = await sendCommand('addmedia', { libelle: selectedMedia.value.libelle }) as string
    selectedMedia.value = null
  }
}
const cmddelfile = async () => {
  if (selectedMediaDel.value) {
    retour.value = await sendCommand('delmedia', { fichier: selectedMediaDel.value }) as string
    selectedMediaDel.value = null
    await cmdListsd()
  }
}


const restorePreviousMedias = async (hdref: string) => {
  try {
    // Récupère la liste des fichiers de la SD
    const disabledFiles = await $fetch<string[]>('http://127.0.0.1:8000/helice/remote', {
      method: 'POST',
      body: {
        hdref: hdref,
        ordre: 'listsd'
      }
    })

    // Filtre les fichiers .gz au lieu de .disabled
    for (const file of disabledFiles.filter(f => f.endsWith('.gz'))) {
      await $fetch('http://127.0.0.1:8000/helice/remote', {
        method: 'POST',
        body: {
          hdref: hdref,
          ordre: 'enablemedia',
          fichier: file
        }
      })
    }
    // Actualise la liste SD après restauration
    await cmdListsd()
  } catch (error) {
    console.error('Erreur de restauration:', error)
  }
}

const matOptions = computed(() => materiels.value.map(m => m.materiel_hdref))

watch(selectedHelice, (newVal) => {
  if (newVal) checkMaterielStatus()
  else pingStatus.value = null
})

onMounted(async () => {
  await fetchUser()
  await fetchMaterielsBySite()
  await fetchMedias()
})

const handleButtonClick = () => {
  console.log('Debug Console button clicked')
}
</script>



<style scoped>

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #f0f9ff, #cbebff);
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
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

.status {
  margin-top: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.status-indicator {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-right: 8px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.status-indicator.online {
  background-color: #28a745;
}

.status-indicator.offline {
  background-color: #dc3545;
}

.status-text {
  font-size: 1rem;
  color: #333;
}

/* Sections générales */
.helice-section, .command-section, .media-section {
  margin-bottom: 40px;
  padding: 20px;
  border-radius: 12px;
  background: #ffffffcc;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.select-container {
  max-width: 320px;
  margin: 0 auto;
}

.debug-btn {
  text-align: center;
  margin-top: 10px;
}

/* Titres de section */
.command-section h2,
.media-section h2 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 1.8rem;
  color: #333;
}

/* Boutons de commande */
.command-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}
.command-buttons > * {
  transition: transform 0.2s;
}
.command-buttons > *:hover {
  transform: translateY(-3px);
}
.command-response {
  text-align: center;
  margin-top: 12px;
  font-size: 1rem;
  color: #555;
}

/* Contenu SD */
.sd-content {
  text-align: center;
  margin: 20px 0;
  font-size: 1.1rem;
  color: #333;
}

/* Gestion des médias */
.media-management {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  margin-top: 20px;
  justify-content: space-around;
}

.media-card {
  flex: 1;
  min-width: 320px;
  padding: 20px;
  border-radius: 12px;
  background: #fdfdfd;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.07);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.media-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

/* Listes et éléments médias */
.media-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  min-height: 100px;
}

.media-item {
  cursor: grab;
}

/* Zones de dépôt */
.drop-zone {
  border: 2px dashed #bbb;
  padding: 20px;
  text-align: center;
  border-radius: 12px;
  background-color: #fafafa;
  margin-top: 15px;
  transition: background-color 0.3s ease;
}
.drop-zone-inner {
  padding: 20px;
}
.drop-zone-inner.drag-over {
  background-color: #e0e0e0;
}

/* Boutons d'action */
.action-btn {
  display: block;
  margin: 12px auto 0;
  transition: background-color 0.3s;
}
.action-btn:hover {
  background-color: #0056b3;
}

/* Pagination */
.pagination {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}
.refresh-btn {
  display: block;
  margin: 0 auto 15px;
}
</style>
