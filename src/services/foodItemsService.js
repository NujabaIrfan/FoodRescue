import React from 'react';
import { collection, query, where, getDocs, orderBy, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export const getFoodItems = async (filters = {}) => {
  try{
    let q = collection(db, 'surplusItems');

    if(filters.status){
      q=query(q, where('status', '==', filters.status));
    }

    if(filters.category){
      q=query(q, where('category', '==', filters.category));
    }

    if(filters.providerName){
      q=query(q, where('providerName', '==', filters.providerName));
    }

    const querySnapShot = await getDocs(q);
    const items=[];

    querySnapShot.forEach((doc)=>{
      items.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return items;
  } catch (error){
    console.error('Error fetching food items: ', error);
    throw error;
  }
};

export const searchFoodItems = async (searchTerm) => {
  try{
    const allItems = await getFoodItems({status: 'available'});

    const searchLower = searchTerm.toLowerCase();
    return allItems.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower) ||
      item.providerName.toLowerCase().includes(searchLower)
    );
  } catch (error){
    console.error('Error searching food items: ', error);
    throw error;
  }
};

