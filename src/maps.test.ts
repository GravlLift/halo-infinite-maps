import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  filmLayoutFor,
  filmWorldBoundsFor,
  mapBackgroundFor,
  weaponPadsFor,
} from './maps';

describe('mapBackgroundFor', () => {
  it('returns an image file name and normalized extents', () => {
    const bg = mapBackgroundFor('Solitude');
    assert.ok(bg);
    assert.match(bg.image, /\.(png|webp)$/);
    assert.ok(bg.maxX > bg.minX && bg.maxY > bg.minY);
  });

  it('is undefined for an unknown map', () => {
    assert.equal(mapBackgroundFor('No Such Map'), undefined);
  });
});

describe('filmLayoutFor', () => {
  it('provides verified three-axis bounds for Live Fire', () => {
    assert.deepEqual(
      filmWorldBoundsFor('309253f8-7a75-48ff-83e1-e7fb3db2ac47'),
      {
        min: [-16.719454, -10.102863, -9.330649],
        max: [46.513535, 53.67172, 13.5679],
      },
    );
    assert.equal(filmWorldBoundsFor('unknown'), undefined);
  });
  it("resolves Bazaar's API asset ID to its position layout", () => {
    assert.deepEqual(filmLayoutFor('298d5036-cd43-47b3-a4bd-31e127566593'), {
      gateBits: 5,
      axisBits: [17, 17, 16],
    });
  });
});

describe('weaponPadsFor', () => {
  it('returns normalized pads for a catalogued map', () => {
    const pads = weaponPadsFor('4a5e5612-2b2e-4375-a0b3-9335a68815f3');
    assert.ok(pads.length > 0);
    for (const p of pads) {
      assert.ok(p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1);
    }
  });

  it('is empty for an unknown map', () => {
    assert.deepEqual(weaponPadsFor('nope'), []);
  });
});
