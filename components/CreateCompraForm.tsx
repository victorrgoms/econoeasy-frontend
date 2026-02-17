'use client'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { useState, useEffect } from "react"
import { useModalStore } from "../store/useModalStore"
import { X } from "lucide-react"
import { Cartao, Pessoa } from "../.next/types"

export default function CreateCompraForm() {
  const { isOpen, fecharModal, compraParaEditar } = useModalStore()
  const queryClient = useQueryClient()

  // Estados
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState('')
  const [compradorId, setCompradorId] = useState('')
  const [cartaoId, setCartaoId] = useState('')
  const [parceiroId, setParceiroId] = useState('')
  const [parcelas, setParcelas] = useState('1')

  useEffect(() => {
    if (compraParaEditar) {
      setDescricao(compraParaEditar.descricao)
      setValor(compraParaEditar.valor.toString())
      setData(compraParaEditar.data)
      setCompradorId(compraParaEditar.comprador?.id.toString() || '')
      setCartaoId(compraParaEditar.cartao?.id.toString() || '')
      setParceiroId(compraParaEditar.parceiroId?.toString() || '')
      setParcelas(compraParaEditar.totalParcelas?.toString() || '1')
    } else {
      limparCampos()
    }
  }, [compraParaEditar, isOpen])

  const limparCampos = () => {
      setDescricao(''); setValor(''); setData(''); setCompradorId(''); setCartaoId(''); setParceiroId(''); setParcelas('1')
  }

  const { data: pessoas } = useQuery<Pessoa[]>({ 
      queryKey: ['pessoas'], 
      queryFn: async () => (await axios.get('http://localhost:8080/pessoas')).data, 
      enabled: isOpen 
  })
  
  const { data: cartoes } = useQuery<Cartao[]>({ 
      queryKey: ['cartoes'], 
      queryFn: async () => (await axios.get('http://localhost:8080/cartoes')).data, 
      enabled: isOpen 
  })

  const mutation = useMutation({
    mutationFn: async (dados: any) => {
      if (compraParaEditar) return axios.put(`http://localhost:8080/compras/${compraParaEditar.id}`, dados)
      else return axios.post('http://localhost:8080/compras', dados)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] })
      queryClient.invalidateQueries({ queryKey: ['resumoPessoas'] })
      queryClient.invalidateQueries({ queryKey: ['resumoCartoes'] })
      fecharModal()
      alert(compraParaEditar ? "Compra atualizada!" : "Compra criada!")
    },
    onError: (error: any) => {
      let mensagem = "Erro ao salvar.";
      if (error.response?.data?.message) mensagem = error.response.data.message;
      else if (typeof error.response?.data === 'string') mensagem = error.response.data;
      alert("❌ " + mensagem);
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dataObj = new Date(data)
    const payload = {
      descricao,
      valor: parseFloat(valor.replace(',', '.')),
      data,
      mesFatura: dataObj.getMonth() + 1,
      anoFatura: dataObj.getFullYear(),
      cartaoId: Number(cartaoId),
      compradorId: Number(compradorId),
      parceiroId: parceiroId ? Number(parceiroId) : null,
      totalParcelas: Number(parcelas)
    }
    mutation.mutate(payload)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-700">{compraParaEditar ? 'Editar Despesa' : 'Nova Despesa'}</h2>
          <button onClick={fecharModal} className="text-gray-400 hover:text-red-500"><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
            <label className="block text-sm font-medium text-gray-600">O que você comprou?</label>
            <input required type="text" value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full border p-2 rounded-lg mt-1 outline-none focus:border-blue-500" placeholder="Ex: Pizza, Uber..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-600">Valor (R$)</label><input required type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} className="w-full border p-2 rounded-lg mt-1 outline-none focus:border-blue-500" placeholder="0,00" /></div>
            <div><label className="block text-sm font-medium text-gray-600">Data</label><input required type="date" value={data} onChange={e => setData(e.target.value)} className="w-full border p-2 rounded-lg mt-1 outline-none focus:border-blue-500" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-600">Quem comprou?</label><select required value={compradorId} onChange={e => setCompradorId(e.target.value)} className="w-full border p-2 rounded-lg mt-1 bg-white outline-none focus:border-blue-500"><option value="">Selecione...</option>{pessoas?.map(p => (<option key={p.id} value={p.id}>{p.nome}</option>))}</select></div>
          <div><label className="block text-sm font-medium text-gray-600">Qual cartão?</label><select required value={cartaoId} onChange={e => setCartaoId(e.target.value)} className="w-full border p-2 rounded-lg mt-1 bg-white outline-none focus:border-blue-500"><option value="">Selecione...</option>{cartoes?.map(c => (<option key={c.id} value={c.id}>{c.apelido}</option>))}</select></div>
          <div><label className="block text-sm font-medium text-gray-600">Parcelas</label><select value={parcelas} onChange={e => setParcelas(e.target.value)} className="w-full border p-2 rounded-lg mt-1 outline-none bg-white"><option value="1">À vista (1x)</option>{[2,3,4,5,6,7,8,9,10,12].map(num => (<option key={num} value={num}>{num}x</option>))}</select></div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100"><label className="block text-sm font-medium text-blue-800 mb-1">Dividir com alguém? (Opcional)</label><select value={parceiroId} onChange={e => setParceiroId(e.target.value)} className="w-full border p-2 rounded-lg bg-white outline-none focus:border-blue-500 text-sm"><option value="">Não, é só meu</option>{pessoas?.map(p => (<option key={p.id} value={p.id}>{p.nome}</option>))}</select></div>

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">{mutation.isPending ? 'Salvando...' : (compraParaEditar ? 'Atualizar' : 'Cadastrar')}</button>
        </form>
      </div>
    </div>
  )
}