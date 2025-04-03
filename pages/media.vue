<script lang="ts" setup>
import { useLazyAsyncData } from '#imports';
import Mediacard from '@/layouts/components/Mediacard.vue';
import { onMounted, ref } from 'vue';

interface User {
  email: string;
  role: string;
  id_user?: number;
}

interface Media {
  id: number;
  description: string;
  libelle: string;
  owner_id: number | null;
  categorie_id: number;
  souscategorie_id: number | null;
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

const user = ref<User>({
  email: 'Unknown',
  role: 'User',
  id_user: undefined,
});

const medias = ref<Media[]>([]);
const filteredMedias = ref<Media[]>([]);
const categories = ref<Categorie[]>([]);
const sousCategories = ref<SousCategorie[]>([]);

const selectedCategory = ref<number | null>(null);
const selectedSubCategory = ref<number | null>(null);

const showPlaylistModal = ref(false);
const currentMedia = ref<Media | null>(null);
const playlists = ref<Playlist[]>([]);

const fetchUser = async () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      user.value.email = decodedPayload.sub || 'Unknown';
      user.value.role = decodedPayload.role || 'User';
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

const fetchMedias = async () => {
  try {
    const { data } = await useLazyAsyncData<Media[]>('medias', () =>
      $fetch('http://127.0.0.1:8000/mediatheque/list')
    );
    if (data.value) {
      medias.value = data.value;
      filterMedias();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des médias:', error);
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

const filterMedias = () => {
  let result = user.value.role === 'Admin'
    ? medias.value
    : medias.value.filter(media =>
        media.owner_id === null || media.owner_id === user.value.id_user
      );

  if (selectedCategory.value !== null) {
    result = result.filter(media => media.categorie_id === selectedCategory.value);
  }
  
  if (selectedSubCategory.value !== null) {
    result = result.filter(media => media.souscategorie_id === selectedSubCategory.value);
  }
  
  filteredMedias.value = result;
};

const selectCategory = (id: number | null) => {
  selectedCategory.value = id;
  selectedSubCategory.value = null;
  filterMedias();
};

const selectSubCategory = (id: number | null) => {
  selectedSubCategory.value = id;
  filterMedias();
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
      list_media_id: [currentMedia.value.id],
      del_media_id: [],
      mip_playlist_id: playlistId,
      mip_add_by: user.value.email,
    };
    const response = await $fetch('http://127.0.0.1:8000/playlist/majmedia', {
      method: 'POST',
      body: payload,
    });
    console.log("Réponse de la mise à jour :", response);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du média dans la playlist :", error);
  }
  
  showPlaylistModal.value = false;
};

onMounted(async () => {
  await fetchUser();
  await fetchCategories();
  await fetchSousCategories();
  await fetchMedias();
});
</script>

<template>
  <div class="header">
    <UIcon name="i-simple-icons-concourse" class="text-green-500 w-12 h-12 mt-5" />
    <h2 class="text-3xl font-semibold ml-6 mt-4 mb-6 text-gray-800">Médiathèque</h2>
  </div>

  <div class="categories">
    <button 
      :class="{ active: selectedCategory === null }" 
      @click="selectCategory(null)">
      Tous
    </button>
    <button 
      v-for="cat in categories" 
      :key="cat.id"
      :class="{ active: selectedCategory === cat.id }" 
      @click="selectCategory(cat.id)">
      {{ cat.nom || "Sans nom" }}
    </button>
  </div>
  
  <div v-if="selectedCategory !== null" class="subcategories">
    <button 
      :class="{ active: selectedSubCategory === null }" 
      @click="selectSubCategory(null)">
      Tous
    </button>
    <button 
      v-for="sub in sousCategories.filter(s => s.categorie_id === selectedCategory)" 
      :key="sub.id"
      :class="{ active: selectedSubCategory === sub.id }" 
      @click="selectSubCategory(sub.id)">
      {{ sub.nom || "Sans nom" }}
    </button>
  </div>

  <div class="media-galerie">
    <div v-for="media in filteredMedias" :key="media.id" class="media-item">
      <Mediacard 
        :descrip="media.description" 
        :libe="media.libelle"  
      />
      <button @click="openPlaylistModal(media)" class="btn-playlist">
        playlist
      </button>
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
.header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
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



.categories {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.categories button {
  padding: 8px 16px;
  border: none;
  background-color: #ddd;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.categories button.active,
.categories button:hover {
  background-color: #aaa;
  color: #fff;
}

.media-galerie {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  padding: 0 20px;
}

/* Styles pour la Mediacard */
.mediacard {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background-color: #fff;
}

.mediacard:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.mediacard img {
  width: 100%;
  height: auto;
  border-bottom: 2px solid #eee;
}

.mediacard .card-content {
  padding: 16px;
}

.mediacard .card-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.mediacard .card-description {
  font-size: 1rem;
  color: #666;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  .media-galerie {
    padding: 0 10px;
  }
}

.categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
  padding: 0 20px;
}

.categories button {
  padding: 10px 20px;
  border: none;
  background: #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  color: #4a5568;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.categories button:hover {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.categories button.active {
  background: #48bb78;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.subcategories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 24px;
  padding: 0 20px;
  position: relative;
}

.subcategories:before {
  content: "";
  position: absolute;
  left: 10px;
  top: 50%;
  height: 70%;
  width: 2px;
  background: #e2e8f0;
  transform: translateY(-50%);
}

.subcategories button {
  padding: 8px 16px;
  border: none;
  background: rgba(72, 187, 120, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  color: #2d3748;
  position: relative;
  margin-left: 20px;
}

.subcategories button:hover {
  background: rgba(72, 187, 120, 0.15);
  transform: translateY(-1px);
}

.subcategories button.active {
  background: #48bb78;
  color: white;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(72, 187, 120, 0.2);
}

.subcategories button.active:before {
  content: "•";
  position: absolute;
  left: -15px;
  color: #48bb78;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .categories, .subcategories {
    padding: 0 10px;
  }
  
  .categories button {
    padding: 8px 16px;
    font-size: 0.9rem;
  }
  
  .subcategories button {
    padding: 6px 12px;
    margin-left: 15px;
  }
  
  .subcategories:before {
    left: 8px;
  }
}

.media-item {
  position: relative;
  margin-bottom: 1rem;
}

.btn-playlist {

  position: absolute;
  bottom: 10px;
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

  transition: opacity 0.2s;

}

/* Style de la modale */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-content {
  background: white;
  padding: 1rem;
  border-radius: 5px;
  width: 300px;
}
.playlist-item {
  cursor: pointer;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
}
.btn-close {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #f44336;
  color: white;
  border: none;
  cursor: pointer;
}

</style>
