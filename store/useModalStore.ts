import { create } from 'zustand'
import { Compra } from '../types'

interface ModalStore {
  isOpen: boolean
  compraParaEditar: Compra | null 
  abrirModal: () => void
  abrirParaEditar: (compra: Compra) => void
  fecharModal: () => void
}

export const useModalStore = create<ModalStore>((set) => ({
  isOpen: false,
  compraParaEditar: null,
  
  abrirModal: () => set({ isOpen: true, compraParaEditar: null }), // Abre limpo
  
  abrirParaEditar: (compra) => set({ isOpen: true, compraParaEditar: compra }), // Abre com dados
  
  fecharModal: () => set({ isOpen: false, compraParaEditar: null }), // Fecha e limpa
}))