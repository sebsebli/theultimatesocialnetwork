import { renderHook, act } from '@testing-library/react-hooks';
import { useComposerSearch } from './useComposerSearch';
import { api } from '../utils/api';

// Mock the API
jest.mock('../utils/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('useComposerSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty results', () => {
    const { result } = renderHook(() => useComposerSearch());
    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it('should debounce search requests', async () => {
    const { result } = renderHook(() => useComposerSearch());

    act(() => {
      result.current.search('test', 'mention');
      result.current.search('test2', 'mention');
    });

    expect(result.current.isSearching).toBe(true);

    // Fast forward time, but not enough for the first debounce (if they were separate, but here we overwrote)
    // Actually, calling search again should clear the previous timeout.
    
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Only the second call should have triggered the API
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/search/users?q=test2');
  });

  it('should handle API success', async () => {
    (api.get as jest.Mock).mockResolvedValue({ hits: [{ id: '1', handle: 'user' }] });
    const { result, waitForNextUpdate } = renderHook(() => useComposerSearch());

    act(() => {
      result.current.search('user', 'mention');
      jest.advanceTimersByTime(150);
    });

    await waitForNextUpdate();

    expect(result.current.results).toEqual([{ id: '1', handle: 'user', type: 'mention' }]);
    expect(result.current.isSearching).toBe(false);
  });

  it('should handle API failure', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Failed'));
    const { result, waitForNextUpdate } = renderHook(() => useComposerSearch());

    act(() => {
      result.current.search('user', 'mention');
      jest.advanceTimersByTime(150);
    });

    await waitForNextUpdate();

    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it('should clear search', () => {
    const { result } = renderHook(() => useComposerSearch());

    act(() => {
      result.current.search('test', 'mention');
      result.current.clearSearch();
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    
    jest.advanceTimersByTime(150);
    expect(api.get).not.toHaveBeenCalled();
  });
});
