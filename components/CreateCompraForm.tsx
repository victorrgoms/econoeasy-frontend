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

  const [descricao, setDescricao] = useState(''); 
  const [valor, setValor] = useState(''); 
  const [tipoValor, setTipoValor] = useState<'TOTAL' | 'PARCELA'>('TOTAL');
  const [data, setData] = useState(''); 
  const [compradorId, setCompradorId] = useState(''); 
  const [cartaoId, setCartaoId] = useState(''); 
  const [parceiroId, setParceiroId] = useState(''); 
  const [parcelas, setParcelas] = useState('1');
  const [parcelaAtualInput, setParcelaAtualInput] = useState('1');

  useEffect(() => {
    if (compraParaEditar) {
      setDescricao(compraParaEditar.descricao); 
      setValor(compraParaEditar.valor.toString()); 
      setData(compraParaEditar.data); 
      setCompradorId(compraParaEditar.comprador?.id.toString() || ''); 
      setCartaoId(compraParaEditar.cartao?.id.toString() || ''); 
      setParceiroId(compraParaEditar.parceiroId?.toString() || ''); 
      setParcelas(compraParaEditar.totalParcelas?.toString() || '1');
      setParcelaAtualInput(compraParaEditar.parcelaAtual?.toString() || '1');
      setTipoValor('PARCELA'); // ao editar o valor que vem ja é o da parcela quebrada
    } else { 
      limparCampos() 
    }
  }, [compraParaEditar, isOpen])

  const limparCampos = () => { 
    setDescricao(''); 
    setValor(''); 
    setTipoValor('TOTAL');
    
    const hoje = new Date().toISOString().split('T')[0];
    setData(hoje);
    
    if (typeof window !== 'undefined') {
        setCompradorId(localStorage.getItem('ultimoComprador') || '');
        setCartaoId(localStorage.getItem('ultimoCartao') || '');
    }

    setParceiroId(''); 
    setParcelas('1');
    setParcelaAtualInput('1');
  }

  const { data: pessoas } = useQuery<Pessoa[]>({ 
      queryKey: ['pessoas', user?.id], 
      queryFn: async () => (await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/pessoas`, { headers: { "X-Usuario-Id": user?.id } })).data, 
      enabled: isOpen && !!user 
  })

  const { data: cartoes } = useQuery<Cartao[]>({ 
      queryKey: ['cartoes', user?.id], 
      queryFn: async () => (await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cartoes`, { headers: { "X-Usuario-Id": user?.id } })).data, 
      enabled: isOpen && !!user 
  })

  const mutation = useMutation({
    mutationFn: async (dados: any) => {
      const config = { headers: { "X-Usuario-Id": user?.id } }
      if (compraParaEditar) {
          return axios.put(`${process.env.NEXT_PUBLIC_API_URL}/compras/${compraParaEditar.id}`, dados, config)
      } else {
          return axios.post(`${process.env.NEXT_PUBLIC_API_URL}/compras`, dados, config)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] }); 
      queryClient.invalidateQueries({ queryKey: ['resumoPessoas'] }); 
      queryClient.invalidateQueries({ queryKey: ['resumoCartoes'] })
      fecharModal(); 
    },
    onError: (error: any) => alert("Erro ao salvar.")
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (typeof window !== 'undefined') {
        localStorage.setItem('ultimoComprador', compradorId);
        localStorage.setItem('ultimoCartao', cartaoId);
    }

    const [anoStr, mesStr] = data.split('-');
    const mesFatura = parseInt(mesStr, 10);
    const anoFatura = parseInt(anoStr, 10);

    const valorInput = parseFloat(valor.replace(',', '.'));
    
    // a api sempre recebe o total e faz a matematica de dividir.
    // entao se o usuario marcou que ta digitando o valor da parcela solta, a gente multiplica antes de enviar
    const valorParaEnviar = tipoValor === 'PARCELA' ? valorInput * Number(parcelas) : valorInput;

    const payload = { 
        descricao, 
        valor: valorParaEnviar, 
        data, 
        mesFatura, 
        anoFatura, 
        cartaoId: Number(cartaoId), 
        compradorId: Number(compradorId), 
        parceiroId: parceiroId ? Number(parceiroId) : null, 
        totalParcelas: Number(parcelas),
        parcelaAtual: Number(parcelaAtualInput)
    }
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
           <div>
               <label className="block text-sm font-medium text-gray-600">Descrição</label>
               <input required value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full border p-2 rounded-xl mt-1 outline-none focus:border-blue-500" placeholder="Ex: Mercado..." />
           </div>
           
           <div className="p-3 bg-gray-50 border rounded-xl">
               <div className="flex gap-4 mb-2">
                   <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                       <input type="radio" checked={tipoValor === 'TOTAL'} onChange={() => setTipoValor('TOTAL')} className="text-blue-600 focus:ring-blue-500" /> Valor Total
                   </label>
                   <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                       <input type="radio" checked={tipoValor === 'PARCELA'} onChange={() => setTipoValor('PARCELA')} className="text-blue-600 focus:ring-blue-500" /> Valor da Parcela
                   </label>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="block text-sm font-medium text-gray-600">Valor</label>
                       <input required type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} className="w-full border p-2 rounded-xl mt-1 outline-none focus:border-blue-500 bg-white" />
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-gray-600">Data</label>
                       <input required type="date" value={data} onChange={e => setData(e.target.value)} className="w-full border p-2 rounded-xl mt-1 bg-white" />
                   </div>
               </div>
           </div>

           <div>
               <label className="block text-sm font-medium text-gray-600">Comprador</label>
               <select required value={compradorId} onChange={e => setCompradorId(e.target.value)} className="w-full border p-2 rounded-xl mt-1 bg-white">
                   <option value="">Selecione...</option>
                   {pessoas?.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
               </select>
           </div>
           <div>
               <label className="block text-sm font-medium text-gray-600">Cartão</label>
               <select required value={cartaoId} onChange={e => setCartaoId(e.target.value)} className="w-full border p-2 rounded-xl mt-1 bg-white">
                   <option value="">Selecione...</option>
                   {cartoes?.map(c => <option key={c.id} value={c.id}>{c.apelido}</option>)}
               </select>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
               <div>
                   <label className="block text-sm font-medium text-gray-600">Total Parcelas</label>
                   <select value={parcelas} onChange={e => { setParcelas(e.target.value); if(e.target.value === '1') setParcelaAtualInput('1'); }} className="w-full border p-2 rounded-xl mt-1 bg-white">
                       <option value="1">À vista (1x)</option>
                       {[2,3,4,5,6,7,8,9,10,12].map(n => <option key={n} value={n}>{n}x</option>)}
                   </select>
               </div>
               {Number(parcelas) > 1 && !compraParaEditar && (
                   <div>
                       <label className="block text-sm font-medium text-gray-600">Parcela Atual</label>
                       <input type="number" min="1" max={parcelas} value={parcelaAtualInput} onChange={e => setParcelaAtualInput(e.target.value)} className="w-full border p-2 rounded-xl mt-1 outline-none focus:border-blue-500" />
                   </div>
               )}
           </div>

           <div className="p-4 bg-blue-50 rounded-xl mt-2">
               <label className="block text-sm font-medium text-blue-800 mb-1">Dividir com alguém?</label>
               <select value={parceiroId} onChange={e => setParceiroId(e.target.value)} className="w-full border p-2 rounded-xl bg-white text-sm">
                   <option value="">Não</option>
                   {pessoas?.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
               </select>
           </div>
           <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition mt-2">
               {mutation.isPending ? 'Salvando...' : 'Salvar Despesa'}
           </button>
        </form>
      </div>
    </div>
  )
}