import Character from '../js/Character';
import Bowman from '../js/bowman';
import Daemon from '../js/daemon';
import { calcTileType } from '../js/utils';

test('Bowman', () => {
  const received = new Bowman(1);
  const expected = {
    level: 1,
    health: 50,
    type: 'bowman',
    attack: 25,
    defence: 25,
    distance: 2,
    distanceAttack: 2,
  };
  expect(received).toEqual(expected);
});

test('Character', () => {
  expect(() => {
    new Character();
  }).toThrow();
});

test('Информация о персонаже', () => {
  const daemon = new Daemon(1);
  const expected = '🎖 1 ⚔ 10 🛡 40 ❤ 50';
  const received = daemon.characterInfo();
  expect(received).toEqual(expected);
});

test('top-left', () => {
  const received = calcTileType(0, 8);
  expect(received).toBe('top-left');
});

test('top-right', () => {
  const received = calcTileType(7, 8);
  expect(received).toBe('top-right');
});

test('bottom-left', () => {
  const received = calcTileType(56, 8);
  expect(received).toBe('bottom-left');
});

test('bottom-right', () => {
  const received = calcTileType(63, 8);
  expect(received).toBe('bottom-right');
});

test('top', () => {
  const received = calcTileType(3, 8);
  expect(received).toBe('top');
});

test('left', () => {
  const received = calcTileType(8, 8);
  expect(received).toBe('left');
});

test('right', () => {
  const received = calcTileType(15, 8);
  expect(received).toBe('right');
});

test('bottom', () => {
  const received = calcTileType(62, 8);
  expect(received).toBe('bottom');
});

test('center', () => {
  const received = calcTileType(10, 8);
  expect(received).toBe('center');
});
