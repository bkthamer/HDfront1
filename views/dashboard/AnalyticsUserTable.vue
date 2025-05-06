<script setup lang="ts">
import avatar1 from '@images/avatars/avatar-1.png'
import avatar2 from '@images/avatars/avatar-2.png'
import avatar3 from '@images/avatars/avatar-3.png'
import avatar4 from '@images/avatars/avatar-4.png'
import avatar5 from '@images/avatars/avatar-5.png'
import avatar6 from '@images/avatars/avatar-6.png'
import avatar7 from '@images/avatars/avatar-7.png'
import avatar8 from '@images/avatars/avatar-8.png'
import axios from 'axios'
import { onMounted, ref } from 'vue'

const headers = [
  { title: 'User', key: 'username' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'role' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions' },
]

const userData = ref<any[]>([])
const sites = ref<any[]>([])
const showDialog = ref(false)
const selectedSites = ref<any[]>([])  
const email = ref<string>('')

const fetchUsers = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/users')
    const users = response.data.map((user: any) => ({
      ...user,
      avatar: resolveUserAvatar(user.id_user),
      status: 'active',
    }))
    userData.value = users
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

const fetchSites = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/sites')
    sites.value = response.data
  } catch (error) {
    console.error('Error fetching sites:', error)
  }
}

const resolveUserAvatar = (userId: number) => {
  const avatars: { [key: number]: string } = {
    1: avatar1, 2: avatar2, 3: avatar3, 4: avatar4, 5: avatar5, 6: avatar6, 7: avatar7, 8: avatar8,
  }
  return avatars[userId] || avatar1
}

const resolveUserRoleVariant = (role: string) => {
  const roleLowerCase = role.toLowerCase()
  if (roleLowerCase === 'subscriber') return { color: 'success', icon: 'ri-user-line' }
  if (roleLowerCase === 'author') return { color: 'error', icon: 'ri-computer-line' }
  if (roleLowerCase === 'maintainer') return { color: 'info', icon: 'ri-pie-chart-line' }
  if (roleLowerCase === 'editor') return { color: 'warning', icon: 'ri-edit-box-line' }
  if (roleLowerCase === 'admin') return { color: 'primary', icon: 'ri-vip-crown-line' }
  return { color: 'success', icon: 'ri-user-line' }
}

const resolveUserStatusVariant = (stat: string) => {
  const statLowerCase = stat.toLowerCase()
  if (statLowerCase === 'pending') return 'warning'
  if (statLowerCase === 'active') return 'success'
  if (statLowerCase === 'inactive') return 'secondary'
  return 'primary'
}

const getUsernamePrefix = (email: string) => email.split('@')[0]


const openPopup = (clientId: number, userEmail: string) => {
  email.value = userEmail

  const userSites = sites.value.filter((site: any) => site.client_id === clientId)
  if (userSites.length > 0) {
    selectedSites.value = userSites
  } else {
    selectedSites.value = sites.value
  }

  showDialog.value = true
}

const assignSite = async (siteId: number) => {
  try {
    await axios.put('http://127.0.0.1:8000/admin/assign_site', {
      email: email.value,
      site_id: siteId,
    })
    console.log(`Site ${siteId} assigned to user ${email.value}`)
    showDialog.value = false  
  } catch (error) {
    console.error('Error assigning site:', error)
  }
}

onMounted(() => {
  fetchUsers()
  fetchSites()
})
</script>

<template>
  <VCard>
    <VDataTable :headers="headers" :items="userData" item-value="id_user" class="text-no-wrap">
      <template #item.username="{ item }">
        <div class="d-flex align-center gap-x-4">
          <VAvatar size="34">
            <VImg v-if="item.avatar" :src="item.avatar" />
          </VAvatar>
          <div class="d-flex flex-column">
            <h6 class="text-h6 font-weight-medium user-list-name">{{ item.fullName }}</h6>
            <span class="text-sm text-medium-emphasis">{{ getUsernamePrefix(item.email) }}</span>
          </div>
        </div>
      </template>
      <template #item.role="{ item }">
        <div class="d-flex gap-4">
          <VIcon :icon="resolveUserRoleVariant(item.role).icon" :color="resolveUserRoleVariant(item.role).color" size="22" />
          <div class="text-capitalize text-high-emphasis">{{ item.role }}</div>
        </div>
      </template>
      <template #item.status="{ item }">
        <VChip :color="resolveUserStatusVariant(item.status)" size="small" class="text-capitalize">{{ item.status }}</VChip>
      </template>
      <template #item.actions="{ item }">
        <VBtn v-if="item.role !== 'admin'" color="primary" @click="openPopup(item.id_user, item.email)">Voir Sites</VBtn>
      </template>
      <template #bottom />
    </VDataTable>
  </VCard>

  <VDialog v-model="showDialog" max-width="500px" transition="dialog-transition">
    <VCard>
      <VCardTitle class="text-h6">Sites de l'utilisateur</VCardTitle>
      <VCardText>
        <ul v-if="selectedSites.length > 0">
          <li v-for="site in selectedSites" :key="site.id" class="site-item">
            <VBtn
              color="primary"
              class="ma-2"
              @click="assignSite(site.id)"
              elevation="2"
            >
              Affecter {{ site.nomsite }}
            </VBtn>
          </li>
        </ul>
        <div v-else class="text-center">
          Aucun site attribué.
        </div>
      </VCardText>
      <VCardActions class="d-flex justify-end">
        <VBtn
          color="secondary"
          @click="showDialog = false"
          class="mr-2"
          elevation="2"
        >
          Fermer
        </VBtn>
      
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.dialog-transition-enter-active, .dialog-transition-leave-active {
  transition: opacity 0.3s ease;
}
.dialog-transition-enter, .dialog-transition-leave-to {
  opacity: 0;
}

.site-item {
  margin-bottom: 10px;
}

.text-center {
  text-align: center;
}

.ma-2 {
  margin: 8px;
}

.elevation-3 {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
