'use client';

import { useEffect, useRef, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { CloseIcon, PlusIcon } from '@/components/icons';

export default function CategoryInput({ initial = [] }) {
  const [categories, setCategories] = useState(initial);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (fetchError) {
        console.error('카테고리 조회 실패:', fetchError);
        setAvailableCategories([]);
        return;
      }

      setAvailableCategories(data ?? []);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddNewCategory() {
    if (!newCategoryName.trim()) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }

    try {
      const supabase = createBrowserSupabase();
      const { data, error: createError } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName.trim() }])
        .select('id, name');

      if (createError) {
        if (createError.code === '23505') {
          setError('이미 존재하는 카테고리입니다.');
        } else {
          setError('카테고리 생성에 실패했습니다.');
        }
        return;
      }

      if (data && data[0]) {
        const newCategory = data[0];
        setAvailableCategories([...availableCategories, newCategory]);
        addCategory(newCategory);
        setNewCategoryName('');
        setError(null);
      }
    } catch (err) {
      console.error('에러:', err);
      setError('카테고리 생성 중 오류가 발생했습니다.');
    }
  }

  function addCategory(category) {
    if (!categories.find(c => c.id === category.id)) {
      setCategories([...categories, category]);
    }
    setShowDropdown(false);
  }

  function removeCategory(categoryId) {
    setCategories(categories.filter(c => c.id !== categoryId));
  }

  const filteredCategories = availableCategories.filter(
    cat => !categories.find(selected => selected.id === cat.id) &&
           cat.name.toLowerCase().includes(newCategoryName.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {/* 선택된 카테고리 태그 */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
          {categories.map(cat => (
            <div
              key={cat.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary-tint)',
                color: 'var(--color-primary)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {cat.name}
              <button
                type="button"
                onClick={() => removeCategory(cat.id)}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 16,
                  border: 'none',
                  background: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <CloseIcon size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 입력 필드 및 드롭다운 */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-2)',
            background: 'var(--color-bg-surface)',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="카테고리 추가..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddNewCategory();
              }
            }}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 14,
              color: 'inherit',
            }}
          />
          <button
            type="button"
            onClick={handleAddNewCategory}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              border: 'none',
              background: 'transparent',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <PlusIcon size={16} />
          </button>
        </div>

        {/* 드롭다운 메뉴 */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              zIndex: 10,
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-2)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-2)',
              maxHeight: 200,
              overflowY: 'auto',
            }}
          >
            {isLoading ? (
              <div style={{ padding: 'var(--space-3)', textAlign: 'center', fontSize: 13, color: 'var(--color-fg-3)' }}>
                로딩 중...
              </div>
            ) : filteredCategories.length === 0 ? (
              newCategoryName.trim() ? (
                <div style={{ padding: 'var(--space-3)', fontSize: 13, color: 'var(--color-fg-3)' }}>
                  '{newCategoryName}' 새로 만들기
                </div>
              ) : (
                <div style={{ padding: 'var(--space-3)', textAlign: 'center', fontSize: 13, color: 'var(--color-fg-3)' }}>
                  {availableCategories.length === 0 ? '카테고리가 없습니다.' : '일치하는 카테고리가 없습니다.'}
                </div>
              )
            ) : (
              filteredCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => addCategory(cat)}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 'var(--space-2) var(--space-3)',
                    border: 'none',
                    background: 'transparent',
                    color: 'inherit',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 13,
                    borderBottom: '1px solid var(--color-border-1)',
                    transition: 'background-color 150ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-bg-pressed)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {cat.name}
                </button>
              ))
            )}
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div style={{ marginTop: 'var(--space-1)', fontSize: 12, color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}
      </div>

      {/* 숨겨진 입력 필드 (form 제출용) */}
      <input
        type="hidden"
        name="categories"
        value={JSON.stringify(categories.map(c => c.id))}
      />
    </div>
  );
}
