<script lang="ts" setup>
import Mediacard from '@/layouts/components/Mediacard.vue';
import { computed, onMounted, ref } from 'vue';

interface User {
  email: string;
  role: string;
  id_user?: number;
  site_id?: string;
}

interface Media {
  id: number;
  description: string;
  libelle: string;
  owner_id: number | null;
  categorie_id: number;
  souscategorie_id: number | null;
  ready: boolean;
}

interface Categorie {
  id: number;
  nom: string;
}

interface SousCategorie {
  id: number;
  nom: string;
  categorie_id: number;
}

interface Playlist {
  id: number;
  proprietaire: number;
  libelle: string;
  description: string;
  status: boolean;
}

interface GroupedPlaylist {
  playlist: Playlist;
  medias: Media[];
}

interface Materiel {
  id: number;
  materiel_hdref: string;
}

interface PlaylistAssignment {
  hdref: string;
  playlist: Playlist;
  medias: Media[];
}

// Références réactives
const user = ref<User>({
  email: 'Unknown',
  role: 'User',
  id_user: undefined,
  site_id: '0'
});

const categories = ref<Categorie[]>([]);
const sousCategories = ref<SousCategorie[]>([]);
const groupedPlaylists = ref<GroupedPlaylist[]>([]);
const selectedCategory = ref<number | null>(null);
const selectedSubCategory = ref<number | null>(null);
const showPlaylistModal = ref(false);
const currentMedia = ref<Media | null>(null);
const playlists = ref<Playlist[]>([]);
const materiels = ref<Materiel[]>([]);
const selectedHelices = ref<{ [playlistId: number]: string | null }>({});

const matOptions = computed(() => materiels.value.map(m => m.materiel_hdref));
const filterGroupedPlaylists = computed(() => {
  return groupedPlaylists.value.map(group => ({
    ...group,
    medias: group.medias.filter(media => {
      const categoryMatch = selectedCategory.value === null || 
                            media.categorie_id === selectedCategory.value;
      const subCategoryMatch = selectedSubCategory.value === null || 
                              media.souscategorie_id === selectedSubCategory.value;
      return categoryMatch && subCategoryMatch;
    })
  })).filter(group => group.medias.length > 0);
});

const deletePlaylist = async (playlistId: number) => {
  try {
    await $fetch('http://127.0.0.1:8000/playlist/delete', {
      method: 'DELETE',
      body: JSON.stringify({ pl_id: playlistId }),
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log(`Playlist ${playlistId} supprimée avec succès.`);
    // Rafraîchir les playlists après suppression
    await fetchPlaylistsData();
  } catch (error) {
    console.error('Erreur lors de la suppression de la playlist:', error);
  }
};

const fetchUser = async () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      user.value.email = decodedPayload.sub || 'Unknown';
      user.value.role = decodedPayload.role || 'User';
      user.value.site_id = decodedPayload.site_id || '0';
      await fetchUserId();
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
    }
  }
};

const fetchUserId = async () => {
  try {
    const response = await $fetch<{ user_id: number }>('http://127.0.0.1:8000/get_user_id', {
      method: 'POST',
      body: { email: user.value.email },
    });
    user.value.id_user = response.user_id;
  } catch (error) {
    console.error('Erreur lors de la récupération de l’ID utilisateur:', error);
  }
};

const fetchPlaylistsData = async () => {
  try {
    const playlistsData = await $fetch<Playlist[]>('http://127.0.0.1:8000/playlist/list');
    const groups: GroupedPlaylist[] = await Promise.all(
      playlistsData.map(async (playlist) => {
        const medias = await $fetch<Media[]>(`http://127.0.0.1:8000/playlist/listmedia/${playlist.id}`);
        return {
          playlist: playlist,
          medias: medias,
        };
      })
    );
    groupedPlaylists.value = groups;
  } catch (error) {
    console.error('Erreur lors de la récupération des playlists et de leurs médias:', error);
  }
};

const fetchCategories = async () => {
  try {
    const categoriesData = await $fetch<Categorie[]>('http://127.0.0.1:8000/categories_all');
    categories.value = categoriesData;
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
  }
};

const fetchSousCategories = async () => {
  try {
    const data = await $fetch<SousCategorie[]>('http://127.0.0.1:8000/souscategorie_all');
    sousCategories.value = data;
  } catch (error) {
    console.error("Erreur lors de la récupération des sous-catégories:", error);
  }
};

const fetchMaterielsBySite = async () => {
  try {
    const response = await $fetch(`http://127.0.0.1:8000/pdv/list/bysite/${user.value.site_id}`);
    materiels.value = response as Materiel[];
  } catch (error) {
    console.error('Erreur récupération matériels:', error);
  }
};

const assignPlaylistToHelice = async (assignment: PlaylistAssignment) => {
  if (!assignment.hdref || !assignment.playlist) return;
  try {
    const existingFiles = await $fetch<string[]>('http://127.0.0.1:8000/helice/remote', {
      method: 'POST',
      body: {
        hdref: assignment.hdref,
        ordre: 'listsd'
      }
    });
    for (const file of existingFiles.filter(f => f.endsWith('.mp4'))) {
      await $fetch('http://127.0.0.1:8000/helice/remote', {
        method: 'POST',
        body: {
          hdref: assignment.hdref,
          ordre: 'disablemedia',
          fichier: file
        }
      });
    }
    for (const media of assignment.medias) {
      await $fetch('http://127.0.0.1:8000/helice/remote', {
        method: 'POST',
        body: {
          hdref: assignment.hdref,
          ordre: 'addmedia',
          libelle: media.libelle
        }
      });
    }
    console.log(`Playlist assignée avec succès à ${assignment.hdref}`);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour:`, error);
  }
};

const selectCategory = (id: number | null) => {
  selectedCategory.value = id;
  selectedSubCategory.value = null;
};

const selectSubCategory = (id: number | null) => {
  selectedSubCategory.value = id;
};

const openPlaylistModal = async (media: Media) => {
  currentMedia.value = media;
  try {
    const data = await $fetch<Playlist[]>('http://127.0.0.1:8000/playlist/list');
    playlists.value = data;
  } catch (error) {
    console.error("Erreur lors de la récupération des playlists:", error);
  }
  showPlaylistModal.value = true;
};

const addMediaToPlaylist = async (playlistId: number) => {
  if (!currentMedia.value) return;
  try {
    const payload = {
      mip_media_id: currentMedia.value.id,
      mip_playlist_id: playlistId
    };
    await $fetch('http://127.0.0.1:8000/playlist/addmedia', {
      method: 'POST',
      body: payload
    });
    await fetchPlaylistsData();
  } catch (error) {
    console.error("Erreur lors de l'ajout du média à la playlist :", error);
  }
  showPlaylistModal.value = false;
};

// Nouvelle méthode pour supprimer un média d'une playlist en utilisant l'endpoint /playlist/majmedia
const removeMediaFromPlaylist = async (playlistId: number, mediaId: number) => {
  try {
    const payload = {
      list_media_id: [],
      del_media_id: [mediaId],
      mip_playlist_id: playlistId,
      mip_add_by: user.value.email
    };
    await $fetch('http://127.0.0.1:8000/playlist/majmedia', {
      method: 'POST',
      body: payload,
    });
    await fetchPlaylistsData();
  } catch (error) {
    console.error("Erreur lors de la suppression du média de la playlist :", error);
  }
};

onMounted(async () => {
  await fetchUser();
  await fetchCategories();
  await fetchSousCategories();
  await fetchPlaylistsData();
  await fetchMaterielsBySite();
});
</script>

<template>
  <div class="header">
    <UIcon name="i-simple-icons-concourse" class="text-green-500 w-12 h-12 mt-5" />
    <h2 class="text-3xl font-semibold ml-6 mt-4 mb-6 text-gray-800">Playlists</h2>
  </div>

  <div class="playlists-container">
    <div 
      v-for="group in filterGroupedPlaylists" 
      :key="group.playlist.id" 
      class="playlist-group"
    >
      <div class="playlist-header">
        <h3 class="playlist-title">{{ group.playlist.libelle }}</h3>
        <p class="playlist-description">{{ group.playlist.description }}</p>
        <span class="badge">{{ group.medias.length }} médias</span>

        <v-select
          v-model="selectedHelices[group.playlist.id]"
          :items="matOptions"
          placeholder="Sélectionner une hélice"
          outlined
          class="helix-select"
          @update:modelValue="(hdref) => assignPlaylistToHelice({ 
            hdref, 
            playlist: group.playlist, 
            medias: group.medias 
          })"
        />

        <VBtn
          @click="deletePlaylist(group.playlist.id)" 
          class="btn-delete"
          title="Supprimer la playlist"
        >
          <UIcon name="i-heroicons-trash" class="mr-1" />
          Supprimer
        </VBtn>
      </div>

      <div class="media-galerie">
        <div 
          v-for="media in group.medias" 
          :key="media.id" 
          class="media-item"
        >
          <Mediacard 
            :descrip="media.description" 
            :libe="media.libelle"
            :ready="media.ready"
          />
          <!-- Bouton pour supprimer le média de la playlist -->
          <button 
            @click="removeMediaFromPlaylist(group.playlist.id, media.id)" 
            class="btn-playlist"
          >
            <UIcon name="i-heroicons-trash" class="mr-1" />
            Supprimer
          </button>
        </div>
      </div>
    </div>

    <div v-if="filterGroupedPlaylists.length === 0" class="empty-state">
      <UIcon name="i-heroicons-musical-note" class="text-4xl text-gray-400" />
      <p class="empty-text">Aucune playlist disponible</p>
    </div>
  </div>

  <VDialog v-model="showPlaylistModal" max-width="500px">
    <VCard>
      <VCardTitle class="dialog-title">
        Affecter à une playlist
      </VCardTitle>
      <VCardText>
        <div v-if="playlists.length > 0" class="playlist-list">
          <VBtn
            v-for="playlist in playlists"
            :key="playlist.id"
            block
            class="playlist-btn"
            @click="addMediaToPlaylist(playlist.id)"
          >
            {{ playlist.libelle }}
          </VBtn>
        </div>
        <div v-else class="no-playlist">
          <UIcon name="i-heroicons-information-circle" class="text-xl mr-2" />
          Créez d'abord une playlist
        </div>
      </VCardText>
      <VCardActions>
        <VBtn
          color="secondary"
          @click="showPlaylistModal = false"
          block
        >
          Fermer
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>


<style scoped>




.filters-container {
  padding: 1rem 2rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.categories, .subcategories {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

button {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid #cbd5e1;
  background: white;
  transition: all 0.2s;
}

button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.playlists-container {
  padding: 2rem;
}

.playlist-group {
  margin-bottom: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.playlist-header {
  padding: 1.5rem;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.playlist-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.playlist-description {
  color: #64748b;
  font-size: 0.9rem;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e2e8f0;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.media-galerie {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.media-item {
  position: relative;
  transition: transform 0.2s;
}

.media-item:hover {
  transform: translateY(-2px);
}

.btn-playlist {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  color: #3b82f6;
  padding: 0.5rem 1rem;
  border: 1px solid #3b82f6;
  border-radius: 20px;
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.media-item:hover .btn-playlist {
  opacity: 1;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: #64748b;
}

.empty-text {
  margin-top: 1rem;
  font-size: 1.1rem;
}

.dialog-title {
  font-weight: 600;
  padding: 1.5rem;
}

.playlist-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.playlist-btn {
  justify-content: flex-start;
  text-transform: none;
  letter-spacing: normal;
}



.no-playlist {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: #64748b;
}



</style>

