import { supabase } from '../supabase/config'

const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || 
                   import.meta.env.VITE_SUPABASE_URL === '';

let demoGalleries = []
let demoItems = []

const loadDemoData = () => {
  if (typeof window !== 'undefined') {
    const g = localStorage.getItem('demo_galleries')
    const i = localStorage.getItem('demo_items')
    demoGalleries = g ? JSON.parse(g) : []
    demoItems = i ? JSON.parse(i) : []
  }
}

const saveDemoGalleries = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('demo_galleries', JSON.stringify(demoGalleries))
  }
}

const saveDemoItems = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('demo_items', JSON.stringify(demoItems))
  }
}

export function useGalleryService() {
  const createGallery = async (userId, name, description = '') => {
    if (isDemoMode) {
      loadDemoData()
      const gallery = {
        id: 'demo_' + Date.now(),
        userId,
        name,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      demoGalleries.unshift(gallery)
      saveDemoGalleries()
      return gallery
    }

    const { data, error } = await supabase
      .from('galleries')
      .insert([{
        user_id: userId,
        name,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  const getGalleries = async (userId) => {
    if (isDemoMode) {
      loadDemoData()
      return demoGalleries.filter(g => g.userId === userId)
    }

    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  const getGallery = async (galleryId) => {
    if (isDemoMode) {
      loadDemoData()
      return demoGalleries.find(g => g.id === galleryId) || null
    }

    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('id', galleryId)
      .single()

    if (error) return null
    return data
  }

  const updateGallery = async (galleryId, data) => {
    if (isDemoMode) {
      loadDemoData()
      const index = demoGalleries.findIndex(g => g.id === galleryId)
      if (index !== -1) {
        demoGalleries[index] = { ...demoGalleries[index], ...data, updated_at: new Date().toISOString() }
        saveDemoGalleries()
      }
      return
    }

    const { error } = await supabase
      .from('galleries')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', galleryId)

    if (error) throw error
  }

  const deleteGallery = async (galleryId) => {
    if (isDemoMode) {
      loadDemoData()
      demoItems = demoItems.filter(i => i.galleryId !== galleryId)
      demoGalleries = demoGalleries.filter(g => g.id !== galleryId)
      saveDemoGalleries()
      saveDemoItems()
      return
    }

    const { data: items } = await getItems(galleryId)
    for (const item of items || []) {
      if (item.glb_url) {
        try {
          const path = item.glb_url.split('/storage/v1/object/public/glb-files/')[1]
          if (path) await supabase.storage.from('glb-files').remove([path])
        } catch (e) {}
      }
      await deleteItem(item.id)
    }

    const { error } = await supabase.from('galleries').delete().eq('id', galleryId)
    if (error) throw error
  }

  const createItem = async (galleryId, file, userId = 'anonymous') => {
    if (isDemoMode) {
      loadDemoData()
      const timestamp = Date.now()
      const item = {
        id: 'demo_item_' + timestamp,
        gallery_id: galleryId,
        name: file.name.replace('.glb', ''),
        file_name: file.name,
        glb_url: URL.createObjectURL(file),
        thumbnail_url: null,
        file_size: file.size,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      demoItems.unshift(item)
      saveDemoItems()
      return item
    }

    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`
    const filePath = `glb/${userId}/${galleryId}/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('glb-files')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('glb-files').getPublicUrl(filePath)
    const glbUrl = urlData?.publicUrl || `https://ngnjgjyxqiufiqgwdixf.supabase.co/storage/v1/object/public/glb-files/${filePath}`

    const item = {
      gallery_id: galleryId,
      name: file.name.replace('.glb', ''),
      file_name: file.name,
      glb_url: glbUrl,
      thumbnail_url: null,
      file_size: file.size,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('items')
      .insert([item])
      .select()
      .single()

    if (error) throw error
    return data
  }

  const getItems = async (galleryId) => {
    if (isDemoMode) {
      loadDemoData()
      return demoItems.filter(i => i.gallery_id === galleryId)
    }

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  const updateItem = async (itemId, data) => {
    if (isDemoMode) {
      loadDemoData()
      const index = demoItems.findIndex(i => i.id === itemId)
      if (index !== -1) {
        demoItems[index] = { ...demoItems[index], ...data, updated_at: new Date().toISOString() }
        saveDemoItems()
      }
      return
    }

    const { error } = await supabase
      .from('items')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', itemId)

    if (error) throw error
  }

  const deleteItem = async (itemId) => {
    if (isDemoMode) {
      loadDemoData()
      demoItems = demoItems.filter(i => i.id !== itemId)
      saveDemoItems()
      return
    }

    const { error } = await supabase.from('items').delete().eq('id', itemId)
    if (error) throw error
  }

  return {
    isDemoMode,
    createGallery,
    getGalleries,
    getGallery,
    updateGallery,
    deleteGallery,
    createItem,
    getItems,
    updateItem,
    deleteItem
  }
}
