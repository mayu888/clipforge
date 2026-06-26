import { beforeEach, test, expect } from 'vitest';
import { useOpStore } from './opStore';

beforeEach(() => {
  useOpStore.setState({
    selectedOpId: null,
    params: {},
    fileConfigs: {},
  });
});

test('saveFileConfig snapshots current opId and params', () => {
  useOpStore.setState({ selectedOpId: 'crop', params: { w: 1280 } });
  useOpStore.getState().saveFileConfig('file-1');
  expect(useOpStore.getState().fileConfigs['file-1']).toEqual({ opId: 'crop', params: { w: 1280 } });
});

test('restoreFileConfig restores saved config', () => {
  useOpStore.setState({
    fileConfigs: { 'file-1': { opId: 'rotate', params: { dir: '90cw' } } },
  });
  useOpStore.getState().restoreFileConfig('file-1');
  expect(useOpStore.getState().selectedOpId).toBe('rotate');
  expect(useOpStore.getState().params).toEqual({ dir: '90cw' });
});

test('restoreFileConfig resets to null/{} when no saved config', () => {
  useOpStore.setState({ selectedOpId: 'crop', params: { w: 100 } });
  useOpStore.getState().restoreFileConfig('unknown-file');
  expect(useOpStore.getState().selectedOpId).toBeNull();
  expect(useOpStore.getState().params).toEqual({});
});
