'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface DataItem {
    _id: string;
    id: string;
    name: string;
    description: string[];
    tags: string[];
    link: string;
    keyFeatures: string[];
}

export default function Admin() {
    const [data, setData] = useState<DataItem[]>([])
    const [filteredData, setFilteredData] = useState<DataItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [formData, setFormData] = useState<Partial<DataItem>>({})
    const [isEditing, setIsEditing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTag, setSelectedTag] = useState('')
    const [viewMode, setViewMode] = useState<'full' | 'compact'>('full')
    const router = useRouter()

    useEffect(() => {
        const savedUsername = localStorage.getItem('username')
        const savedPassword = localStorage.getItem('password')

        if (savedUsername && savedPassword) {
            authenticateUser(savedUsername, savedPassword)
        } else {
            router.push('/')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router])

    useEffect(() => {
        filterData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, searchTerm, selectedTag])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/showai')
            if (!response.ok) {
                throw new Error('Failed to fetch data')
            }
            const result = await response.json()
            setData(result)
        } catch (error) {
            console.error('Error fetching data:', error)
            setError('An error occurred while fetching data')
        } finally {
            setIsLoading(false)
        }
    }

    const filterData = () => {
        let filtered = data
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.some(desc => desc.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        }
        if (selectedTag) {
            filtered = filtered.filter(item =>
                item.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
            )
        }
        setFilteredData(filtered)
    }

    const handleAdd = () => {
        const maxId = Math.max(...data.map(item => parseInt(item.id)), 0);
        setFormData({ id: (maxId + 1).toString(), keyFeatures: [] })
        setIsEditing(false)
        setIsFormOpen(true)
    }

    const handleEdit = (item: DataItem) => {
        setFormData({ ...item, keyFeatures: item.keyFeatures || [] })
        setIsEditing(true)
        setIsFormOpen(true)
    }

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa "${name}"?`)) {
            try {
                const response = await fetch('/api/showai', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id }),
                })
                if (!response.ok) {
                    throw new Error('Failed to delete item')
                }
                fetchData()
            } catch (error) {
                console.error('Error deleting item:', error)
                setError('An error occurred while deleting the item')
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = '/api/showai'
            const method = isEditing ? 'PUT' : 'POST'
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...formData, keyFeatures: formData.keyFeatures || [] }),
            })
            if (!response.ok) {
                throw new Error(`Failed to ${isEditing ? 'update' : 'add'} item`)
            }
            fetchData()
            setIsFormOpen(false)
        } catch (error) {
            console.error(`Error ${isEditing ? 'updating' : 'adding'} item:`, error)
            setError(`An error occurred while ${isEditing ? 'updating' : 'adding'} the item`)
        }
    }

    const authenticateUser = async (username: string, password: string) => {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            })

            if (!response.ok) {
                throw new Error('Authentication failed')
            }

            const data = await response.json()
            if (data.success) {
                fetchData()
            } else {
                router.push('/')
            }
        } catch (error) {
            console.error('Authentication error:', error)
            router.push('/')
        }
    }

    if (isLoading) return <div className="text-center mt-8">Loading...</div>
    if (error) return <div className="text-center mt-8 text-red-500">{error}</div>

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Quản lý dữ liệu</h1>
            <div className="mb-6 flex flex-col sm:flex-row flex-wrap items-center gap-4">
                <button
                    onClick={handleAdd}
                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105"
                >
                    Thêm mới
                </button>
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc mô tả"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 border rounded"
                />
                <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 border rounded"
                >
                    <option value="">Tất cả tags</option>
                    {Array.from(new Set(data.flatMap(item => item.tags))).map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                    ))}
                </select>
                <button
                    onClick={() => setViewMode(viewMode === 'full' ? 'compact' : 'full')}
                    className="w-full sm:w-auto bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
                >
                    {viewMode === 'full' ? 'Chế độ thu gọn' : 'Chế độ đầy đủ'}
                </button>
            </div>
            <div className={viewMode === 'full' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                {filteredData.map((item) => (
                    viewMode === 'full' ? (
                        <div key={item._id} className="border p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-4">{item.name}</h2>
                            <ul className="mb-4 list-disc list-inside space-y-2">
                                {item.description.map((desc, index) => (
                                    <li key={index} className="text-sm sm:text-base text-gray-700">{desc}</li>
                                ))}
                            </ul>
                            <div className="flex flex-wrap mb-4">
                                {item.tags.map((tag, index) => (
                                    <span key={index} className="bg-gray-200 rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-gray-700 mr-2 mb-2">{tag}</span>
                                ))}
                            </div>
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 hover:underline mb-4 block transition duration-300 ease-in-out">
                                Liên kết
                            </a>
                            {item.keyFeatures && item.keyFeatures.length > 0 && (
                                <div className="mb-4">
                                    <strong className="text-base sm:text-lg">Tính năng chính:</strong>
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        {item.keyFeatures.map((feature, index) => (
                                            <li key={index} className="text-sm sm:text-base text-gray-700">{feature}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                                <button
                                    onClick={() => handleEdit(item)}
                                    className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
                                >
                                    Sửa
                                </button>
                                <button
                                    onClick={() => handleDelete(item._id, item.name)}
                                    className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div key={item._id} className="flex flex-col sm:flex-row justify-between items-center border p-4 rounded-lg shadow-md">
                            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0">{item.name}</h2>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-2 sm:mt-0">
                                <button
                                    onClick={() => handleEdit(item)}
                                    className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
                                >
                                    Sửa
                                </button>
                                <button
                                    onClick={() => handleDelete(item._id, item.name)}
                                    className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    )
                ))}
            </div>
            {isFormOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
                    <div className="bg-white p-4 sm:p-8 rounded-lg shadow-xl w-full max-w-2xl">
                        <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
                            {isEditing ? 'Sửa dữ liệu' : 'Thêm dữ liệu mới'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                                    Tên
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                                    Mô tả (mỗi dòng một mô tả)
                                </label>
                                <textarea
                                    id="description"
                                    value={formData.description ? formData.description.join('\n') : ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value.split('\n').filter(desc => desc.trim() !== '') })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
                                    rows={5}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tags">
                                    Tags (phân cách bằng dấu phẩy)
                                </label>
                                <input
                                    type="text"
                                    id="tags"
                                    value={formData.tags ? formData.tags.join(', ') : ''}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(tag => tag.trim()) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="link">
                                    Liên kết
                                </label>
                                <input
                                    type="url"
                                    id="link"
                                    value={formData.link || ''}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="keyFeatures">
                                    Tính năng chính (mỗi dòng một tính năng, để trống nếu không có)
                                </label>
                                <textarea
                                    id="keyFeatures"
                                    value={formData.keyFeatures ? formData.keyFeatures.join('\n') : ''}
                                    onChange={(e) => {
                                        const features = e.target.value.split('\n').filter(feature => feature.trim() !== '');
                                        setFormData({ ...formData, keyFeatures: features });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
                                    rows={5}
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    {isEditing ? 'Cập nhật' : 'Thêm'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="w-full sm:w-auto bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}