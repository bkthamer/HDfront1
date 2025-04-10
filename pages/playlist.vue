<script lang="ts" setup>
import Mediacard from '@/layouts/components/Mediacard.vue';
import { computed, onMounted, ref } from 'vue';

// Interfaces existantes...
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

interface PDV {
  pdv_id: number;
  pdv_hdref: string;
  pdv_emplacement: string;
  site_id: number;
  site_hdref: string;
  client_id: number;
  client_societe: string;
}

// Nouvel objet pour la grille
interface GrilleForm {
  playlist_id: number | null;
  helice_hdref: string;
  start_date: string; // format ISO attendu
  end_date: string;   // format ISO attendu
  media_ids: number[];
}

// ----------------------
// États Réactifs
// ----------------------
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
const selectedPDVs = ref<{ [playlistId: number]: string | null }>({});
const showPDVModal = ref(false);
const selectedPDVList = ref<PDV[]>([]);
const selectedPlaylistTitle = ref<string>('');
const selectedPlaylist = ref<Playlist | null>(null); // sera utilisé pour le calendrier et assignations

// Nouveaux états pour le calendrier de grille
const showCalendarModal = ref(false);
const grilleForm = ref<GrilleForm>({
  playlist_id: null,
  helice_hdref: '',
  start_date: '',
  end_date: '',
  media_ids: []
});

// ----------------------
// Computed
// ----------------------
const filterGroupedPlaylists = computed(() => {
  return groupedPlaylists.value
    .map(group => ({
      ...group,
      medias: group.medias.filter(media => {
        const categoryMatch = selectedCategory.value === null || media.categorie_id === selectedCategory.value;
        const subCategoryMatch = selectedSubCategory.value === null || media.souscategorie_id === selectedSubCategory.value;
        return categoryMatch && subCategoryMatch;
      })
    }))
    .filter(group => group.medias.length > 0);
});

const matOptions = computed(() => materiels.value.map(m => m.materiel_hdref));

// ----------------------
// Fonctions existantes
// ----------------------
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
    console.error("Erreur lors de l'assignation à l'hélice:", error);
  }
};

const assignPlaylistToPDV = async (assignment: { pdvId: number; playlist: Playlist; }) => {
  if (!assignment.pdvId || !assignment.playlist) return;
  try {
    const payload = {
      list_pdv_id: [assignment.pdvId],
      del_pdv_id: [],
      pip_playlist_id: assignment.playlist.id,
      pip_add_by: user.value.email
    };
    await $fetch('http://127.0.0.1:8000/playlist/majpdv', {
      method: 'POST',
      body: payload,
    });
    console.log(`Association PDV ajoutée avec succès pour la playlist ${assignment.playlist.libelle}`);
  } catch (error) {
    console.error("Erreur lors de l'association du PDV à la playlist :", error);
  }
};

// Fonction de restauration appelée lorsque end_date est atteinte
const restorePreviousMedias = async (hdref: string) => {
  try {
    const response = await $fetch('http://127.0.0.1:8000/helice/remote', {
      method: 'POST',
      body: {
        hdref: hdref,
        ordre: 'enablemedia',
        fichier: "dis"
      }
    });
    console.log("Réponse de restauration :", response);
    // Vous pouvez rafraîchir la liste ou afficher un message à l'utilisateur ici.
  } catch (error) {
    console.error('Erreur de restauration:', error);
  }
};

// ----------------------
// Gestion du calendrier de grille et assignation
// ----------------------

// Modification de la fonction openCalendarModal pour enregistrer le playlist sélectionné
const openCalendarModal = (playlist: Playlist, selectedHdref: string) => {
  // Enregistre le playlist dans l'état global pour une utilisation ultérieure
  selectedPlaylist.value = playlist;

  // Récupérer le materiel correspondant au PDV sélectionné
  const pdv = materiels.value.find(m => m.materiel_hdref === selectedHdref);
  if (!pdv) return;

  // Préparer le formulaire de grille
  grilleForm.value.playlist_id = playlist.id;
  grilleForm.value.helice_hdref = pdv.materiel_hdref;
  // Préremplir start_date et end_date avec des valeurs par défaut (exemple : début immédiat et fin dans 2 heures)
  const now = new Date();
  grilleForm.value.start_date = now.toISOString().substring(0, 16); // format "YYYY-MM-DDTHH:mm"
  const end = new Date(now.getTime() + 2 * 60 * 60 * 1000); // + 2 heures
  grilleForm.value.end_date = end.toISOString().substring(0, 16);
  // Déduire les media_ids de la playlist
  const group = groupedPlaylists.value.find(g => g.playlist.id === playlist.id);
  grilleForm.value.media_ids = group ? group.medias.map(m => m.id) : [];

  // Afficher le calendrier
  showCalendarModal.value = true;
};

// Modification de submitGrille pour :
// - Ajouter la grille dans la base de données
// - Assigner la playlist à l'hélice (avec les médias) et au PDV (si sélectionné)
// - Déclencher le timeout pour restauration à end_date
const submitGrille = async () => {
  try {
    // Envoi de la grille au backend
    const response = await $fetch('http://127.0.0.1:8000/grille/add', {
      method: 'POST',
      body: JSON.stringify(grilleForm.value),
      headers: { "Content-Type": "application/json" }
    });
    console.log("Grille ajoutée :", response);
    showCalendarModal.value = false;

    // Calcul du délai en ms pour la date de début
    const startDateTime = new Date(grilleForm.value.start_date);
    const now = new Date();
    const assignDelay = startDateTime.getTime() - now.getTime();

    // Fonction pour exécuter l'affectation de la playlist à l'hélice et au PDV
    const executeAssignment = async () => {
      if (selectedPlaylist.value) {
        // Récupérer le groupe de médias associé à la playlist
        const group = groupedPlaylists.value.find(g => g.playlist.id === grilleForm.value.playlist_id);
        if (group) {
          await assignPlaylistToHelice({
            hdref: grilleForm.value.helice_hdref,
            playlist: selectedPlaylist.value,
            medias: group.medias
          });
        }
        // Si un PDV a été sélectionné pour cette playlist, lancer l'assignation PDV
        const pdvIdStr = selectedPDVs.value[selectedPlaylist.value.id];
        if (pdvIdStr) {
          const pdvId = parseInt(pdvIdStr);
          await assignPlaylistToPDV({ pdvId, playlist: selectedPlaylist.value });
        }
      }
    };

    if (assignDelay > 0) {
      console.log("L'affectation de la playlist débutera à", grilleForm.value.start_date);
      setTimeout(() => {
        executeAssignment();
      }, assignDelay);
    } else {
      // Si la date de début est dans le passé ou immédiate, on affecte tout de suite
      await executeAssignment();
    }

    // Calculer le délai (ms) entre maintenant et la date de fin pour lancer la restauration
    const endDateTime = new Date(grilleForm.value.end_date);
    const restoreDelay = endDateTime.getTime() - Date.now();
    if (restoreDelay > 0) {
      console.log("Début du timeout pour restauration à", grilleForm.value.end_date);
      setTimeout(() => {
        restorePreviousMedias(grilleForm.value.helice_hdref);
      }, restoreDelay);
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout de la grille :", error);
  }
};


// Modification de assignPlaylistCombined pour ouvrir le calendrier au lieu d'une assignation immédiate
const assignPlaylistCombined = async (playlist: Playlist, selectedHdref: string) => {
  // Ouvre le popup calendrier afin de saisir les informations de grille
  openCalendarModal(playlist, selectedHdref);
  // L'assignation vers hélice et PDV se déclenche après validation dans submitGrille
};

// ----------------------
// Autres fonctions de gestion de playlist et PDV
// ----------------------
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

const openPDVPopup = async (playlist: Playlist) => {
  try {
    const pdvData = await $fetch<PDV[]>(`http://127.0.0.1:8000/playlist/listpdv/${playlist.id}`);
    selectedPDVList.value = pdvData;
    selectedPlaylistTitle.value = playlist.libelle;
    selectedPlaylist.value = playlist;
    showPDVModal.value = true;
  } catch (error) {
    console.error("Erreur lors de la récupération des points de diffusion :", error);
  }
};

const removePDVFromPlaylist = async (pdvId: number) => {
  if (!selectedPlaylist.value) return;
  try {
    const payload = {
      list_pdv_id: [],
      del_pdv_id: [pdvId],
      pip_playlist_id: selectedPlaylist.value.id,
      pip_add_by: user.value.email
    };
    await $fetch('http://127.0.0.1:8000/playlist/majpdv', {
      method: 'POST',
      body: payload
    });
    await openPDVPopup(selectedPlaylist.value);
  } catch (error) {
    console.error("Erreur lors de la suppression du PDV :", error);
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
  <!-- ... votre template existant ... -->

  <!-- Bloc des playlists -->
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
        
        <!-- V-select mis à jour pour appeler la nouvelle logique -->
        <v-select
          v-model="selectedPDVs[group.playlist.id]"
          :items="matOptions"
          placeholder="Sélectionner un PDV"
          outlined
          class="combined-select"
          @update:modelValue="(selectedHdref) => assignPlaylistCombined(group.playlist, selectedHdref)"
        />

        <div class="flex justify-between items-center mt-4">
          <VBtn
            @click="deletePlaylist(group.playlist.id)" 
            class="btn-delete"
            title="Supprimer la playlist"
          >
            <UIcon name="i-heroicons-trash" class="mr-1" />
            Supprimer Playlist
          </VBtn>
        </div>

        <div class="flex justify-between items-center mt-4">
          <VBtn 
            @click="openPDVPopup(group.playlist)"
            class="btn-pdv"
            title="Voir points diffusion"
          >
            <UIcon name="i-heroicons-information-circle" class="mr-1" />
            Voir points diffusion
          </VBtn>
        </div>
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

  <!-- Popup pour ajouter un média à une playlist existante -->
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

  <!-- Popup pour afficher les PDVs associés -->
  <VDialog v-model="showPDVModal" max-width="600px" transition="dialog-bottom-transition">
    <VCard class="pdv-card">
      <VCardTitle class="dialog-title">
        Points de diffusion de la playlist: <span class="playlist-title">{{ selectedPlaylistTitle }}</span>
      </VCardTitle>
      <VCardText class="pdv-content">
        <div v-if="selectedPDVList.length > 0" class="table-container">
          <table class="table-pdv">
            <thead>
              <tr>
                <th>HDRef</th>
                <th>Site</th>
                <th>Société</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pdv in selectedPDVList" :key="pdv.pdv_id">
                <td>{{ pdv.pdv_hdref }}</td>
                <td>{{ pdv.site_hdref }}</td>
                <td>{{ pdv.client_societe }}</td>
                <td>
                  <VBtn color="red" small @click="removePDVFromPlaylist(pdv.pdv_id)" title="Supprimer PDV">
                    <UIcon name="i-heroicons-trash" class="mr-1" />
                    Supprimer
                  </VBtn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="no-pdv">
          <UIcon name="i-heroicons-exclamation" class="mr-2" />
          Aucun point de diffusion associé.
        </div>
      </VCardText>
      <VCardActions class="pdv-actions">
        <VBtn color="purple" @click="showPDVModal = false" block>
          Fermer
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Nouveau popup pour le calendrier de grille -->
  <VDialog v-model="showCalendarModal" max-width="600px" transition="dialog-bottom-transition">
    <VCard class="calendar-card">
      <VCardTitle class="dialog-title">
        Planifier la grille pour la playlist (ID: {{ grilleForm.playlist_id }})
      </VCardTitle>
      <VCardText class="calendar-content">
        <div class="form-group">
          <label for="start_date">Date & heure de début</label>
          <!-- Intégration d'un composant date-time picker adapté -->
          <input id="start_date" type="datetime-local" v-model="grilleForm.start_date" />
        </div>
        <div class="form-group">
          <label for="end_date">Date & heure de fin</label>
          <input id="end_date" type="datetime-local" v-model="grilleForm.end_date" />
        </div>
        <!-- Affichage en lecture seule de l'HDRef et des médias concernés -->
        <div class="form-group">
          <label>Helice HDRef</label>
          <input type="text" v-model="grilleForm.helice_hdref" readonly />
        </div>
        <div class="form-group">
          <label>Médias (IDs)</label>
          <div>{{ grilleForm.media_ids.join(', ') }}</div>
        </div>
      </VCardText>
      <VCardActions class="calendar-actions">
        <!-- Bouton de confirmation de la grille -->
        <VBtn color="primary" @click="submitGrille" block>Valider la grille</VBtn>
        
      </VCardActions>
    </VCard>
  </VDialog>
</template>



<style scoped>



.dialog-bottom-transition-enter-active,
.dialog-bottom-transition-leave-active {
  transition: all 0.3s ease;
}
.dialog-bottom-transition-enter-from,
.dialog-bottom-transition-leave-to {
  transform: translateY(30px);
  opacity: 0;
}


.pdv-card {
  border-radius: 12px;
  overflow: hidden;
  background-color: #ffff; 
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}


.dialog-title {
  font-size: 1.5rem;
  font-weight: bold;
  background-color: #fff; 
  color: #ce13ef;
  padding: 16px;
}


.playlist-title {
  font-style: italic;
}


.pdv-content {
  padding: 20px;
  background-color: #ffffff;
}


.table-container {
  max-height: 300px;
  overflow-y: auto;
}
.table-pdv {
  width: 100%;
  border-collapse: collapse;
}
.table-pdv th,
.table-pdv td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}
.table-pdv th {
  background-color: #e303be; 
}


.no-pdv {
  text-align: center;
  color: #757575;
  font-size: 1.1rem;
  padding: 20px 0;
}


.pdv-actions {
  padding: 16px;
  background-color: #f3e5f5;
}


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




