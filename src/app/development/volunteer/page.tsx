"use client"

import { GET_API } from '@/api/request'
import { endpoints } from '@/api/constants'
import { useQuery } from '@tanstack/react-query'
import React, { useState } from 'react'
import { JsonViewer } from "@textea/json-viewer"

const page = () => {
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const getAllVolunteers = async () => {
    const response = await GET_API(endpoints.volunteer.allVolunteers)
    return response
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['volunteer'],
    queryFn: getAllVolunteers
  })

  // Extract the actual volunteer data from the response
  const volunteers = data?.data || []

  // Filter by status and search query
  const filteredData = volunteers.filter((volunteer: any) => {
    // Status filter
    const statusMatch = filterStatus === 'all' || volunteer.onboarded_status === filterStatus
    
    // Search filter
    const searchLower = searchQuery.toLowerCase()
    const nameMatch = volunteer.volunteer_first_name?.toLowerCase().includes(searchLower) ||
                     volunteer.volunteer_last_name?.toLowerCase().includes(searchLower) ||
                     `${volunteer.volunteer_first_name} ${volunteer.volunteer_last_name}`.toLowerCase().includes(searchLower)
    const emailMatch = volunteer.email?.toLowerCase().includes(searchLower)
    const idMatch = volunteer.id?.toLowerCase().includes(searchLower)
    
    const searchMatch = !searchQuery || nameMatch || emailMatch || idMatch
    
    return statusMatch && searchMatch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verification_completed':
        return 'text-green-600 bg-green-100'
      case 'details_pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'pending':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const handleRefetch = () => {
    refetch()
    setSelectedVolunteer(null) // Clear selection when refetching
  }

  if (isLoading) return <div className="p-4">Loading volunteers...</div>
  if (error) return <div className="p-4 text-red-600">Error loading volunteers</div>

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Volunteer Development Page</h1>
        <div className="flex items-center gap-4">
          <div className="text-xl text-gray-600 font-bold">
            Total Volunteers: <span className="text-blue-600">{volunteers.length || 0}</span>
          </div>
          <button
            onClick={handleRefetch}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Refreshing...' : '🔄 Refetch'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">
            {volunteers.filter((v: any) => v.onboarded_status === 'verification_completed').length || 0}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">
            {volunteers.filter((v: any) => v.onboarded_status === 'details_pending').length || 0}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {volunteers.filter((v: any) => v.chat_permission).length || 0}
          </div>
          <div className="text-sm text-gray-600">Chat Enabled</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">
            {volunteers.filter((v: any) => v.volunteer_languages?.length > 0).length || 0}
          </div>
          <div className="text-sm text-gray-600">With Languages</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium">Filter by Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="verification_completed">Completed</option>
            <option value="details_pending">Pending</option>
          </select>
        </div>
        
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing: {filteredData.length} of {volunteers.length}
        </div>
      </div>

      {/* Volunteer List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List View */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Volunteer List</h2>
          <div className="space-y-2 max-h-[83vh] overflow-y-auto">
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No volunteers found matching your search.' : 'No volunteers available.'}
              </div>
            ) : (
              filteredData.map((volunteer: any, index: number) => (
                <div 
                  key={index}
                  onClick={() => setSelectedVolunteer(volunteer)}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedVolunteer === volunteer ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {volunteer.volunteer_first_name} {volunteer.volunteer_last_name}
                      </div>
                      <div className="text-sm text-gray-600">{volunteer.email}</div>
                      {volunteer.id && (
                        <div className="text-xs text-gray-500">ID: {volunteer.id}</div>
                      )}
                      <div className="text-xs text-gray-500">
                        Created: {new Date(volunteer.created_on).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(volunteer.onboarded_status)}`}>
                      {volunteer.onboarded_status}
                    </span>
                  </div>
                  {volunteer.volunteer_skills && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500">Skills:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {volunteer.volunteer_skills.slice(0, 3).map((skill: any, skillIndex: number) => (
                          <span key={skillIndex} className="px-2 py-1 bg-gray-200 rounded text-xs">
                            {skill.skill_name}
                          </span>
                        ))}
                        {volunteer.volunteer_skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-200 rounded text-xs">
                            +{volunteer.volunteer_skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="space-y-4  overflow-y-auto">
          <h2 className="text-lg font-semibold">Selected Volunteer Details</h2>
          {selectedVolunteer ? (
            <div className="border  rounded-lg p-4 bg-gray-50">
              <JsonViewer 
                value={selectedVolunteer} 
                theme="dark"
                style={{ maxHeight: '800px', overflow: 'auto' }}
              />
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center text-gray-500">
              Select a volunteer from the list to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default page