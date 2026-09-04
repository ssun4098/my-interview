'use client';

import { useEffect, useRef, useState } from 'react';
import { listCategories, createCategory } from '@/lib/category-actions';
import { CloseIcon, PlusIcon } from '@/components/icons';

export default function CategoryInput({ initial = [] }) {
  const [categories, setCategories] = useState(initial);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  // 조회/생성 모두 Server Action 을 거칩니다. 브라우저 Supabase 클라이언트로
  // 직접 호출하면 세션이 실리지 않아 anon 롤이 되고, categories 의 RLS 정책이
  // authenticated 대상이라 조회는 빈 배열, 생성은 42501 로 막힙니다.
  async function fetchCategories() {
    setIsLoading(true);
    try {
      const { categories: fetched, error: fetchError } = await listCategories();
      if (fetchError) setError(fetchError);
      setAvailableCategories(fetched ?? []);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddNewCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }
    if (isCreating) return;

    setIsCreating(true);
    try {
      const result = await createCategory(name);

      if (result.error) {
        setError(result.error);
        return;
      }

      const newCategory = result.category;
      // 이미 있던 카테고리면 목록에 중복으로 넣지 않고 선택만 합니다.
      setAvailableCategories((prev) =>
        prev.some((c) => c.id === newCategory.id) ? prev : [...prev, newCategory],
      );
      addCategory(newCategory);
      setNewCategoryName('');
      setError(null);
    } catch (err) {
      console.error('카테고리 생성 중 오류:', err);
      setError('카테고리 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreating(false);
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
            disabled={isCreating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              border: 'none',
              background: 'transparent',
              color: 'var(--color-primary)',
              cursor: isCreating ? 'default' : 'pointer',
              opacity: isCreating ? 0.5 : 1,
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
                  &quot;{newCategoryName}&quot; 새로 만들기
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
