<script lang="ts" setup>
import Mediacard from '@/layouts/components/Mediacard.vue';
import { computed, onMounted, ref } from 'vue';


interface User { email: string; role: string; id_user?: number; site_id?: string; }
interface Media { id: number; description: string; libelle: string; owner_id: number | null; categorie_id: number; souscategorie_id: number | null; ready: boolean; }
interface Categorie { id: number; nom: string; }
interface SousCategorie { id: number; nom: string; categorie_id: number; }
interface Playlist { id: number; proprietaire: number; libelle: string; description: string; status: boolean; }
interface GroupedPlaylist { playlist: Playlist; medias: Media[]; }
interface Materiel { id: number; materiel_hdref: string; }
interface PDV { pdv_id: number; pdv_hdref: string; pdv_emplacement: string; site_id: number; site_hdref: string; client_id: number; client_societe: string; }


const user = ref<User>({ email: 'Unknown', role: 'User', id_user: undefined, site_id: '0' });
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
const showExistingSchedulesModal = ref(false)
const existingSchedules = ref<any[]>([])


const showPDVActionModal = ref(false);
const actionPDVHdref = ref<string | null>(null);
const actionPlaylist = ref<Playlist | null>(null);


const showPDVModal = ref(false);
const selectedPDVList = ref<PDV[]>([]);
const selectedPlaylistTitle = ref<string>('');
const selectedPlaylist = ref<Playlist | null>(null);


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


const fetchUser = async () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    try {
      const payloadBase64 = token.split('.')[1];
      const decoded = JSON.parse(atob(payloadBase64));
      user.value.email = decoded.sub || 'Unknown';
      user.value.role = decoded.role || 'User';
      user.value.site_id = decoded.site_id || '0';
      await fetchUserId();
    } catch (error) {
      console.error('Erreur décodage token', error);
    }
  }
};

const fetchUserId = async () => {
  try {
    const { user_id } = await $fetch<{ user_id: number }>('http://127.0.0.1:8000/get_user_id', {
      method: 'POST',
      body: { email: user.value.email }
    });
    user.value.id_user = user_id;
  } catch (error) {
    console.error('Erreur fetchUserId', error);
  }
};


const fetchPlaylistsData = async () => {
  try {
    const playlistsData = await $fetch<Playlist[]>('http://127.0.0.1:8000/playlist/list');
    const visible = user.value.role === 'admin'
      ? playlistsData
      : playlistsData.filter(p => p.proprietaire === 0 || p.proprietaire === user.value.id_user);

    const groups = await Promise.all(
      visible.map(async playlist => ({
        playlist,
        medias: await $fetch<Media[]>(`http://127.0.0.1:8000/playlist/listmedia/${playlist.id}`)
      }))
    );
    groupedPlaylists.value = groups;
  } catch (error) {
    console.error('Erreur fetchPlaylistsData', error);
  }
};

const fetchCategories = async () => {
  try { categories.value = await $fetch<Categorie[]>('http://127.0.0.1:8000/categories_all'); }
  catch (error) { console.error('Erreur fetchCategories', error); }
};
const fetchSousCategories = async () => {
  try { sousCategories.value = await $fetch<SousCategorie[]>('http://127.0.0.1:8000/souscategorie_all'); }
  catch (error) { console.error('Erreur fetchSousCategories', error); }
};
const fetchMaterielsBySite = async () => {
  try { materiels.value = await $fetch<Materiel[]>(`http://127.0.0.1:8000/pdv/list/bysite/${user.value.site_id}`); }
  catch (error) { console.error('Erreur fetchMaterielsBySite', error); }
};


const addPDVToPlaylist = async (playlistId: number, pdvHdref: string) => {
  const pdv = materiels.value.find(m => m.materiel_hdref === pdvHdref);
  if (!pdv) return;
  try {
    await $fetch('http://127.0.0.1:8000/playlist/majpdv', {
      method: 'POST',
      body: { list_pdv_id: [pdv.id], del_pdv_id: [], pip_playlist_id: playlistId, pip_add_by: user.value.email }
    });
  } catch (error) {
    console.error('Erreur addPDVToPlaylist', error);
    throw error;
  }
};

const plOn = async (id: number) => {
  try {
    const email = encodeURIComponent(user.value.email);
    await fetch(`http://127.0.0.1:8000/playlist/on/${id}?qui=${email}`);
  }
  catch (e) { console.error('Erreur plOn', e); }
};
const plOff = async (id: number) => {
  try {
    const email = encodeURIComponent(user.value.email);
    const res = await fetch(`http://127.0.0.1:8000/playlist/off/${id}?qui=${email}`);
    if (!res.ok) throw new Error(await res.json().then(r => r.detail).catch(() => `HTTP ${res.status}`));
    await fetchPlaylistsData();
  } catch (e) { 
    if (e instanceof Error) {
      console.error('Erreur plOff', e); 
      alert(`Échec désactivation: ${e.message}`);
    } else {
      console.error('Erreur plOff', e); 
      alert('Échec désactivation: Une erreur inconnue est survenue.');
    }
  }
};


const onPDVSelect = async (pl: Playlist, hd: string) => {
  try {
    await addPDVToPlaylist(pl.id, hd);
    actionPlaylist.value = pl;
    actionPDVHdref.value = hd;
    showPDVActionModal.value = true;
    selectedPDVs.value[pl.id] = null;
  } catch {};
};
const confirmOn = async () => { if (actionPlaylist.value) { await plOn(actionPlaylist.value.id); await fetchPlaylistsData(); showPDVActionModal.value = false; }};
const confirmOff = async () => { if (actionPlaylist.value) { await plOff(actionPlaylist.value.id); showPDVActionModal.value = false; }};


const fetchExistingSchedules = async (playlistId: number) => {
  try {
    existingSchedules.value = await $fetch(`http://127.0.0.1:8000/playlist/listgrille/${playlistId}`)
    showExistingSchedulesModal.value = true
  } catch (error) {
    console.error('Erreur fetchExistingSchedules', error)
    alert('Impossible de charger les planifications')
  }
}

const deletePlaylist = async (id: number) => {
  try {
    await $fetch('http://127.0.0.1:8000/playlist/delete', {
      method: 'DELETE',
     
      body: { 
        pl_id: id,
        pl_mode: 'OFF'     
      },
    });
    await fetchPlaylistsData();
  } catch (e) {
    console.error('Erreur suppression playlist', e);
    alert('Échec de la suppression');
  }
};



const openPlaylistModal = async (m: Media) => { currentMedia.value = m; playlists.value = await $fetch<Playlist[]>('http://127.0.0.1:8000/playlist/list'); showPlaylistModal.value = true; };
const addMediaToPlaylist = async (pid: number) => { if (!currentMedia.value) return; await $fetch('http://127.0.0.1:8000/playlist/addmedia',{method:'POST',body:{mip_media_id:currentMedia.value.id,mip_playlist_id:pid}}); await fetchPlaylistsData(); showPlaylistModal.value = false; };
const removeMediaFromPlaylist = async (pid:number, mid:number)=>{ await $fetch('http://127.0.0.1:8000/playlist/majmedia',{method:'POST',body:{list_media_id:[],del_media_id:[mid],mip_playlist_id:pid,mip_add_by:user.value.email}}); fetchPlaylistsData(); };


const openPDVPopup = async (pl:Playlist) => { selectedPDVList.value = await $fetch<PDV[]>(`http://127.0.0.1:8000/playlist/listpdv/${pl.id}`); selectedPlaylistTitle.value=pl.libelle; selectedPlaylist.value=pl; showPDVModal.value=true; };
const removePDVFromPlaylist = async (pid:number) => { if(!selectedPlaylist.value) return; await $fetch('http://127.0.0.1:8000/playlist/majpdv',{method:'POST',body:{list_pdv_id:[],del_pdv_id:[pid],pip_playlist_id:selectedPlaylist.value.id,pip_add_by:user.value.email}}); openPDVPopup(selectedPlaylist.value); };



const showScheduleModal = ref(false)
const scheduleType = ref<'date'|'periodic'>('date')
const scheduleForm = ref({
  sch_playlist_id: 0,
  sch_start_to_end: true,
  sch_start_date: '',
  sch_end_date: '',
  sch_day_of_week: [] as number[],
  sch_hour_start: '',
  sch_hour_end: ''
})
const days = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']

const openDateSchedule = (pl: Playlist) => {
  showPDVActionModal.value = false
  scheduleType.value = 'date'

  scheduleForm.value = {
    sch_playlist_id: pl.id,
    sch_start_to_end: true,
    sch_start_date: '',
    sch_end_date: '',
    sch_day_of_week: [],
    sch_hour_start: '',
    sch_hour_end: ''
  }
  showScheduleModal.value = true
}

const openPeriodicSchedule = (pl: Playlist) => {
  showPDVActionModal.value = false
  scheduleType.value = 'periodic'
 
  scheduleForm.value = {
    sch_playlist_id: pl.id,
    sch_start_to_end: false,
    sch_start_date: '',
    sch_end_date: '',
    sch_day_of_week: [],
    sch_hour_start: '',
    sch_hour_end: ''
  }
  showScheduleModal.value = true
}


const submitSchedule = async () => {

  const payload = {
    sch_playlist_id: scheduleForm.value.sch_playlist_id,
    sch_start_to_end: scheduleForm.value.sch_start_to_end,
    sch_start_date: new Date(scheduleForm.value.sch_start_date).toISOString().split('T')[0],
    sch_end_date: new Date(scheduleForm.value.sch_end_date).toISOString().split('T')[0],
    sch_day_of_week: scheduleForm.value.sch_day_of_week,
    sch_hour_start: scheduleForm.value.sch_hour_start.slice(0, 5), 
    sch_hour_end: scheduleForm.value.sch_hour_end.slice(0, 5)
  }

  try {
    await $fetch('http://127.0.0.1:8000/playlist/addgrille', {
      method: 'POST',
      body: payload
    })
    showScheduleModal.value = false
  } catch (error) {
    console.error('Erreur lors de la planification', error)
    if (error instanceof Error) {
      alert('Échec de la planification : ' + (error as any).data?.detail || error.message);
    } else {
      alert('Échec de la planification : Une erreur inconnue est survenue.');
    }
  }
}



const deleteSchedule = async (id: number) => {
  if (!actionPlaylist.value) return;
  
  try {
    await $fetch('http://127.0.0.1:8000/playlist/delgrille', {
      method: 'DELETE',
      body: {
        id: id,
        playlist_id: actionPlaylist.value.id
      }
    });
    
   
    await fetchExistingSchedules(actionPlaylist.value.id);
    alert('Planification supprimée avec succès');
  } catch (error) {
    console.error('Erreur lors de la suppression', error);
    alert('Échec de la suppression de la planification');
  }
}


// Oninit
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
          v-model="selectedPDVs[group.playlist.id]"
          :items="matOptions"
          placeholder="Sélectionner un PDV"
          outlined
          class="combined-select"
          @update:modelValue="val => onPDVSelect(group.playlist, val)"
        />
        <div class="flex justify-between items-center mt-4">
          <VBtn
            v-if="user.role === 'admin'"
            @click="deletePlaylist(group.playlist.id)"
            class="btn-delete"
          >
            <UIcon name="i-heroicons-trash" class="mr-1" /> Supprimer
          </VBtn>
          <VBtn
            v-if="user.role === 'admin'"
            @click="openPDVPopup(group.playlist)"
            class="btn-pdv"
          >
            <UIcon name="i-heroicons-information-circle" class="mr-1" /> PDV
          </VBtn>
        </div>
      </div>

      <div class="media-galerie">
        <div v-for="m in group.medias" :key="m.id" class="media-item">
          <Mediacard :descrip="m.description" :libe="m.libelle" :ready="m.ready" />
          <button
          v-if="user.role === 'admin' || (user.role === 'user' && group.playlist?.proprietaire === user.id_user)"

            @click="removeMediaFromPlaylist(group.playlist.id, m.id)"
            class="btn-playlist"
          >
            <UIcon name="i-heroicons-trash" class="mr-1" /> Suppr.
          </button>
        </div>
      </div>
    </div>

    <div v-if="!filterGroupedPlaylists.length" class="empty-state">
      <UIcon name="i-heroicons-musical-note" class="text-4xl text-gray-400" />
      <p class="empty-text">Aucune playlist disponible</p>
    </div>
  </div>


  <VDialog
  v-model="showPDVActionModal"
  max-width="750"
  transition="scale-transition"
  attach="body"
>
  <VCard class="rounded-lg elevation-5">
    <VCardTitle class="d-flex align-center pa-6 pb-4 text-h5 font-weight-bold">
      <UIcon 
        name="i-heroicons-musical-note" 
        class="mr-3 text-primary" 
        size="28"
      />
      <span class="text-gradient">{{ actionPlaylist?.libelle }}</span>
    </VCardTitle>

    <VCardText class="px-6 pt-0 pb-4">
      <div class="d-flex align-center pa-4 rounded-lg bg-grey-lighten-4">
        <UIcon name="i-heroicons-tv" class="mr-3 text-indigo" size="22" />
        <span class="text-body-1 font-weight-medium">{{ actionPDVHdref }}</span>
      </div>
    </VCardText>

    <VDivider />

    <VCardActions class="pa-6 pt-4 justify-space-between">
      <VBtn
        color="success"
        variant="flat"
        size="large"
        class="px-6 font-weight-bold"
        @click="confirmOn"
      >
        <UIcon name="i-heroicons-play" class="mr-2" />
        Lancer
      </VBtn>
      
      <VBtn
        color="error"
        variant="flat"
        size="large"
        class="px-6 font-weight-bold"
        @click="confirmOff"
      >
        <UIcon name="i-heroicons-stop" class="mr-2" />
        Arrêter
      </VBtn>
      
      <VBtn
        color="primary"
        variant="text"
        size="large"
        class="font-weight-bold"
        @click="openDateSchedule(actionPlaylist!)"
      >
        <UIcon name="i-heroicons-calendar" class="mr-2" />
        Planification
      </VBtn>
      
      <VBtn
        color="secondary"
        variant="text"
        size="large"
        class="font-weight-bold"
        @click="openPeriodicSchedule(actionPlaylist!)"
      >
        <UIcon name="i-heroicons-clock" class="mr-2" />
        Périodique
      </VBtn>

      <!-- button permet a lutilisateur voir tout , mais pour user il peut voir seulement planif de son playlist seulement -->
      <VBtn
      v-if="user.role === 'admin' || (user.role === 'user' && actionPlaylist?.proprietaire === user.id_user)"
        color="info"
        variant="text"
        size="large"
        class="font-weight-bold"
        @click="fetchExistingSchedules(actionPlaylist!.id)"
      >
        <UIcon name="i-heroicons-list-bullet" class="mr-2" />
        Voir planifs
      </VBtn>
    </VCardActions>
  </VCard>
</VDialog>





  <VDialog
  v-model="showScheduleModal"
  width="600"
  transition="dialog-bottom-transition"
  attach="body"
  content-class="custom-dialog"
>
  <VCard class="rounded-lg overflow-hidden">
    <VCardTitle 
      class="text-white bg-gradient-primary py-4 d-flex align-center justify-center"
      style="
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      "
    >
      <h2 class="font-weight-bold text-h5 mb-0 text-shadow">📅 Planification</h2>
    </VCardTitle>

    <VCardText class="pa-6">
      <VRow dense class="mt-2">
        <VCol cols="6" class="mb-4">
          <VTextField
            v-model="scheduleForm.sch_start_date"
            label="Date début"
            type="date"
            required
            variant="outlined"
            color="primary"
            class="input-glow"
            style="--c: #6366f1"
          />
        </VCol>

        <VCol cols="6" class="mb-4">
          <VTextField
            v-model="scheduleForm.sch_end_date"
            label="Date fin"
            type="date"
            :required="scheduleType === 'date'"
            variant="outlined"
            color="primary"
            class="input-glow"
            style="--c: #8b5cf6"
          />
        </VCol>

        <VCol cols="6">
          <VTextField
            v-model="scheduleForm.sch_hour_start"
            label="Heure début"
            type="time"
            required
            variant="outlined"
            color="primary"
            prepend-inner-icon="mdi-clock-outline"
          />
        </VCol>

        <VCol cols="6">
          <VTextField
            v-model="scheduleForm.sch_hour_end"
            label="Heure fin"
            type="time"
            :required="scheduleType === 'date'"
            variant="outlined"
            color="primary"
            prepend-inner-icon="mdi-clock-outline"
          />
        </VCol>

        <VCol cols="12" v-if="scheduleType === 'periodic'" class="mt-4">
          <div class="d-flex flex-wrap gap-3 justify-center">
            <VCheckbox
              v-for="(day, i) in days"
              :key="i"
              v-model="scheduleForm.sch_day_of_week"
              :value="i"
              :label="day"
              color="success"
              inline
              class="day-checkbox rounded-pill px-4"
            />
          </div>
        </VCol>
      </VRow>
    </VCardText>

    <VCardActions class="pa-6 pt-0 d-flex justify-end gap-3">
      <VBtn
        color="success"
        @click="submitSchedule"
        variant="flat"
        class="btn-glow"
        style="
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        "
      >
        Valider ✨
      </VBtn>
      
      <VBtn
        variant="text"
        @click="showScheduleModal = false"
        class="text-grey-darken-1 hover-scale"
      >
        Fermer
      </VBtn>
    </VCardActions>
  </VCard>
</VDialog>


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
                  <VBtn 
                  
                  color="red" small @click="removePDVFromPlaylist(pdv.pdv_id)" title="Supprimer PDV">
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


  <VDialog
  v-model="showExistingSchedulesModal"
  max-width="800"
  transition="dialog-bottom-transition"
  attach="body"
>
  <VCard class="rounded-lg">
    <VCardTitle class="d-flex align-center bg-blue-darken-2 text-white pa-4">
      <UIcon name="i-heroicons-calendar-days" class="mr-2" size="24" />
      Planifications existantes
      <VSpacer />
      <VBtn icon @click="showExistingSchedulesModal = false" variant="text" color="white">
        <UIcon name="i-heroicons-x-mark" size="24" />
      </VBtn>
    </VCardTitle>

    <VCardText class="pa-0">
      <VTable class="schedule-table">
        <thead>
          <tr>
            <th>Date début</th>
            <th>Date fin</th>
            <th>Heure début</th>
            <th>Heure fin</th>
            <th>Jours</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="schedule in existingSchedules" :key="schedule.id">
            <td>{{ schedule.start_date }}</td>
            <td>{{ schedule.end_date }}</td>
            <td>{{ schedule.hour_start }}</td>
            <td>{{ schedule.hour_end }}</td>
            <td>
              <VChip
                v-for="day in schedule.day_of_week"
                :key="day"
                color="primary"
                size="small"
                class="mr-1 mb-1"
              >
                {{ ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][day] }}
              </VChip>
              <span v-if="!schedule.day_of_week.length">Tous les jours</span>
            </td>
            <td>
              <VBtn
                color="error"
                variant="text"
                size="small"
                 @click="deleteSchedule(schedule.id)"
              >
                <UIcon name="i-heroicons-trash" class="mr-1" />
                Supprimer
              </VBtn>
            </td>
          </tr>
          <tr v-if="!existingSchedules.length">
            <td colspan="6" class="text-center py-4 text-grey">
              Aucune planification existante
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCardText>

    <VCardActions class="pa-4 justify-end">
      <VBtn
        color="blue-darken-2"
        @click="showExistingSchedulesModal = false"
      >
        Fermer
      </VBtn>
    </VCardActions>
  </VCard>
</VDialog>

</template>



<style scoped>

.text-gradient {
  background: linear-gradient(45deg, #4A6CF7, #6A11CB);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.v-card {
  background: white;
  border-radius: 12px;
}

.v-btn {
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.v-btn:hover {
  transform: translateY(-2px);
}

.custom-dialog {
  backdrop-filter: blur(5px);
  background: rgba(255, 255, 255, 0.1) !important;
}

.input-glow .v-field__outline {
  transition: box-shadow 0.3s ease;
}

.input-glow .v-field:hover .v-field__outline {
  box-shadow: 0 0 12px var(--c);
}

.day-checkbox .v-selection-control__input:hover .v-icon {
  transform: scale(1.2);
}

.text-shadow {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.btn-glow {
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
}

.btn-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(16, 185, 129, 0.4);
}

.hover-scale {
  transition: transform 0.2s;
}

.hover-scale:hover {
  transform: scale(1.05);
}




.schedule-table {
  width: 100%;
  border-collapse: collapse;
}

.schedule-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  padding: 12px 16px;
  text-align: left;
}

.schedule-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.schedule-table tr:hover td {
  background-color: #f9f9f9;
}

.text-gradient {
  background: linear-gradient(45deg, #4A6CF7, #6A11CB);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}




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


.glassmorphism-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(12px);
  border-radius: 16px !important;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
}

.gradient-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white !important;
  padding: 20px !important;
  border-radius: 16px 16px 0 0 !important;
}

.header-icon {
  font-size: 32px;
  color: rgba(255, 255, 255, 0.9);
}

.pdv-info-container {
  position: relative;
  padding: 16px;
  background: rgba(245, 245, 245, 0.6);
  border-radius: 12px;
}

.pdv-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: rgba(100, 100, 255, 0.1);
  border-radius: 8px;
  border: 1px solid #3f51b5;
  color: #3f51b5;
}

.decorative-divider {
  border-color: rgba(0, 0, 0, 0.1) !important;
  border-width: 2px !important;
}

.action-btn {
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 180px;
  padding: 12px 24px;
  overflow: hidden;
}

.action-btn .hover-effect {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}

.action-btn:hover .hover-effect {
  opacity: 1;
}

.animate-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.15) !important;
}

.action-description {
  display: flex;
  align-items: center;
  color: #666;
  margin-top: 12px;
}

</style>




