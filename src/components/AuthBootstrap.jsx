'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadAuthStateFromStorage } from '../redux/slices/authslice';

export default function AuthBootstrap() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(loadAuthStateFromStorage());
  }, [dispatch]);
  return null;
}


