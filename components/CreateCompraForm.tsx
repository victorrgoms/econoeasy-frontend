'use client'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { useState, useEffect } from "react"
import { useModalStore } from "../store/useModalStore"
import { X } from "lucide-react"
import { Cartao, Pessoa } from "../types"
import { useUser } from "@clerk/nextjs"

export default function CreateCompraForm() {
  const { isOpen, fecharModal, compraParaEditar } = useModalStore()
  const queryClient = useQueryClient()
  const { user } = useUser()

  // Estados
  const [descricao, setDescricao] = useState(''); const [valor, setValor] = useState(''); const [data, setData] = useState(''); const [compradorId, setCompradorId] = useState(''); const [cartaoId, setCartaoId] = useState(''); const [parceiroId, setParceiroId] = useState(''); const [parcelas, setParcelas] = useState('1')

  useEffect(() => {
    if (compraParaEditar) {
      setDescricao(compraParaEditar.descricao); setValor(compraParaEditar.valor.toString()); setData(compraParaEditar.data); setCompradorId(compraParaEditar.comprador?.id.toString() || ''); setCartaoId(compraParaEditar.cartao?.id.toString() || ''); setParceiroId(compraParaEditar.parceiroId?.toString() || ''); setParcelas(compraParaEditar.totalParcelas?.toString() || '1')
    } else { limparCampos() }
  }, [compraParaEditar, isOpen])

  const limparCampos = () => { setDescricao(''); setValor(''); setData(''); setCompradorId(''); setCartaoId(''); setParceiroId(''); setParcelas('1') }

  // Queries com Header
  const { data: pessoas } = useQuery<Pessoa[]>({ 
      queryKey: ['pessoas', user?.id], 
      queryFn: async () => (await axios.get('${process.env.NEXT_PUBLIC_API_URL}/pessoas', { headers: { "X-Usuario-Id": user?.id } })).data, 
      enabled: isOpen && !!user 
  })
  const { data: cartoes } = useQuery<Cartao[]>({ 
      queryKey: ['cartoes', user?.id], 
      queryFn: async () => (await axios.get('${process.env.NEXT_PUBLIC_API_URL}/cartoes', { headers: { "X-Usuario-Id": user?.id } })).data, 
      enabled: isOpen && !!user 
  })

  // Mutação com Header
  const mutation = useMutation({
    mutationFn: async (dados: any) => {
      const config = { headers: { "X-Usuario-Id": user?.id } }
      if (compraParaEditar) return axios.put(`${process.env.NEXT_PUBLIC_API_URL}/compras/${compraParaEditar.id}`, dados, config)
      else return axios.post('${process.env.NEXT_PUBLIC_API_URL}/compras', dados, config)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] }); queryClient.invalidateQueries({ queryKey: ['resumoPessoas'] }); queryClient.invalidateQueries({ queryKey: ['resumoCartoes'] })
      fecharModal(); alert(compraParaEditar ? "Compra atualizada!" : "Compra criada!")
    },
    onError: (error: any) => alert("Erro ao salvar.")
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dataObj = new Date(data)
    const payload = { descricao, valor: parseFloat(valor.replace(',', '.')), data, mesFatura: dataObj.getMonth() + 1, anoFatura: dataObj.getFullYear(), cartaoId: Number(cartaoId), compradorId: Number(compradorId), parceiroId: parceiroId ? Number(parceiroId) : null, totalParcelas: Number(parcelas) }
    mutation.mutate(payload)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-700">{compraParaEditar ? 'Editar Despesa' : 'Nova Despesa'}</h2>
          <button onClick={fecharModal} className="text-gray-400 hover:text-red-500"><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
           {/* ... Inputs (mesmo HTML de antes) ... */}
           <div><label className="block text-sm font-medium text-gray-600">Descrição</label><input required value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full border p-2 rounded-xl mt-1 outline-none focus:border-blue-500" placeholder="Ex: Pizza..." /></div>
           <div className="grid grid-cols-2 gap-4">
               <div><label className="block text-sm font-medium text-gray-600">Valor</label><input required type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} className="w-full border p-2 rounded-xl mt-1 outline-none focus:border-blue-500" /></div>
               <div><label className="block text-sm font-medium text-gray-600">Data</label><input required type="date" value={data} onChange={e => setData(e.target.value)} className="w-full border p-2 rounded-xl mt-1" /></div>
           </div>
           <div><label className="block text-sm font-medium text-gray-600">Comprador</label><select required value={compradorId} onChange={e => setCompradorId(e.target.value)} className="w-full border p-2 rounded-xl mt-1 bg-white"><option value="">Selecione...</option>{pessoas?.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
           <div><label className="block text-sm font-medium text-gray-600">Cartão</label><select required value={cartaoId} onChange={e => setCartaoId(e.target.value)} className="w-full border p-2 rounded-xl mt-1 bg-white"><option value="">Selecione...</option>{cartoes?.map(c => <option key={c.id} value={c.id}>{c.apelido}</option>)}</select></div>
           <div><label className="block text-sm font-medium text-gray-600">Parcelas</label><select value={parcelas} onChange={e => setParcelas(e.target.value)} className="w-full border p-2 rounded-xl mt-1 bg-white"><option value="1">À vista (1x)</option>{[2,3,4,5,6,7,8,9,10,12].map(n => <option key={n} value={n}>{n}x</option>)}</select></div>
           <div className="p-4 bg-blue-50 rounded-xl"><label className="block text-sm font-medium text-blue-800 mb-1">Dividir?</label><select value={parceiroId} onChange={e => setParceiroId(e.target.value)} className="w-full border p-2 rounded-xl bg-white text-sm"><option value="">Não</option>{pessoas?.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
           <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">{mutation.isPending ? 'Salvando...' : 'Salvar'}</button>
        </form>
      </div>
    </div>
  )
}