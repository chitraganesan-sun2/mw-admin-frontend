"use client"

import { GET_API } from '@/api/request'
import { endpoints } from '@/api/constants'
import { useQuery } from '@tanstack/react-query'
import React, { useState } from 'react'
import { JsonViewer } from "@textea/json-viewer"

const page = () => {
  const [selectedLearner, setSelectedLearner] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const getAllLearners = async () => {
    const response = await GET_API(endpoints.learner.allLearners)
    return response
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['learner'],
    queryFn: getAllLearners
  })

  // Extract the actual learner data from the response
  const learners = data?.data || []

  // Filter by status and search query
  const filteredData = learners.filter((learner: any) => {
    // Status filter
    const statusMatch = filterStatus === 'all' || learner.onboarded_status === filterStatus
    
    // Search filter
    const searchLower = searchQuery.toLowerCase()
    const learnerNameMatch = learner.learner_personal_info?.learner_first_name?.toLowerCase().includes(searchLower) ||
                            learner.learner_personal_info?.learner_last_name?.toLowerCase().includes(searchLower) ||
                            `${learner.learner_personal_info?.learner_first_name} ${learner.learner_personal_info?.learner_last_name}`.toLowerCase().includes(searchLower)
    const parentNameMatch = learner.parent_info?.parent_first_name?.toLowerCase().includes(searchLower) ||
                           learner.parent_info?.parent_last_name?.toLowerCase().includes(searchLower) ||
                           `${learner.parent_info?.parent_first_name} ${learner.parent_info?.parent_last_name}`.toLowerCase().includes(searchLower)
    const emailMatch = learner.email?.toLowerCase().includes(searchLower)
    const idMatch = learner.id?.toLowerCase().includes(searchLower)
    
    const searchMatch = !searchQuery || learnerNameMatch || parentNameMatch || emailMatch || idMatch
    
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

  const getDisabilityColor = (disability: string) => {
    switch (disability?.toLowerCase()) {
      case 'hearing impairment':
        return 'text-blue-600 bg-blue-100'
      case 'visual impairment':
        return 'text-purple-600 bg-purple-100'
      case 'autism':
        return 'text-orange-600 bg-orange-100'
      case 'adhd':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const handleRefetch = () => {
    refetch()
    setSelectedLearner(null) // Clear selection when refetching
  }

  if (isLoading) return <div className="p-4">Loading learners...</div>
  if (error) return <div className="p-4 text-red-600">Error loading learners</div>

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Learner Development Page</h1>
        <div className="flex items-center gap-4">
          <div className="text-xl text-gray-600 font-bold">
            Total Learners: <span className="text-blue-600">{learners.length || 0}</span>
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
            {learners.filter((l: any) => l.onboarded_status === 'verification_completed').length || 0}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">
            {learners.filter((l: any) => l.onboarded_status === 'details_pending').length || 0}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {learners.filter((l: any) => l.learner_special_needs?.type_of_developmental_disability).length || 0}
          </div>
          <div className="text-sm text-gray-600">With Special Needs</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">
            {learners.filter((l: any) => l.learner_goals?.skills_to_learn?.length > 0).length || 0}
          </div>
          <div className="text-sm text-gray-600">With Learning Goals</div>
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
              placeholder="Search by learner name, parent name, email, or ID..."
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
          Showing: {filteredData.length} of {learners.length}
        </div>
      </div>

      {/* Learner List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List View */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Learner List</h2>
          <div className="space-y-2 max-h-[83vh] overflow-y-auto">
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No learners found matching your search.' : 'No learners available.'}
              </div>
            ) : (
              filteredData.map((learner: any, index: number) => (
                <div 
                  key={index}
                  onClick={() => setSelectedLearner(learner)}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedLearner === learner ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">
                        {learner.learner_personal_info?.learner_first_name} {learner.learner_personal_info?.learner_last_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Parent: {learner.parent_info?.parent_first_name} {learner.parent_info?.parent_last_name}
                      </div>
                      <div className="text-sm text-gray-600">{learner.email}</div>
                      {learner.id && (
                        <div className="text-xs text-gray-500">ID: {learner.id}</div>
                      )}
                      <div className="text-xs text-gray-500">
                        Created: {new Date(learner.created_on).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(learner.onboarded_status)}`}>
                        {learner.onboarded_status}
                      </span>
                      {learner.learner_special_needs?.type_of_developmental_disability && (
                        <span className={`px-2 py-1 rounded-full text-xs ${getDisabilityColor(learner.learner_special_needs.type_of_developmental_disability)}`}>
                          {learner.learner_special_needs.type_of_developmental_disability}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Additional Info */}
                  <div className="mt-3 space-y-2">
                    {learner.learner_goals?.skills_to_learn && learner.learner_goals.skills_to_learn.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500">Learning Goals:</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {learner.learner_goals.skills_to_learn.slice(0, 2).map((skill: any, skillIndex: number) => (
                            <span key={skillIndex} className="px-2 py-1 bg-green-200 rounded text-xs">
                              {skill.skill_name}
                            </span>
                          ))}
                          {learner.learner_goals.skills_to_learn.length > 2 && (
                            <span className="px-2 py-1 bg-green-200 rounded text-xs">
                              +{learner.learner_goals.skills_to_learn.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {learner.learner_special_needs?.areas_of_support_needed && learner.learner_special_needs.areas_of_support_needed.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500">Support Areas:</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {learner.learner_special_needs.areas_of_support_needed.slice(0, 2).map((area: string, areaIndex: number) => (
                            <span key={areaIndex} className="px-2 py-1 bg-orange-200 rounded text-xs">
                              {area}
                            </span>
                          ))}
                          {learner.learner_special_needs.areas_of_support_needed.length > 2 && (
                            <span className="px-2 py-1 bg-orange-200 rounded text-xs">
                              +{learner.learner_special_needs.areas_of_support_needed.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="space-y-4 overflow-y-auto">
          <h2 className="text-lg font-semibold">Selected Learner Details</h2>
          {selectedLearner ? (
            <div className="border rounded-lg p-4 bg-gray-50">
              <JsonViewer 
                value={selectedLearner} 
                theme="dark"
                style={{ maxHeight: '800px', overflow: 'auto' }}
              />
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center text-gray-500">
              Select a learner from the list to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default page