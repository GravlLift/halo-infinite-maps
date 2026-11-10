import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  filmLayoutFor,
  filmPlaneBoundsFor,
  filmWorldBoundsFor,
  GameVariantCategory,
  mapBackgroundFor,
  mapObjectivesFor,
  normalizedPerMeter,
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
  it('provides horizontal bounds for maps without vertical calibration', () => {
    const bounds = filmPlaneBoundsFor('70dd38c5-2eb7-4db3-8901-0dfca292ff18');
    assert.ok(bounds && bounds.maxX > bounds.minX && bounds.maxY > bounds.minY);
    assert.equal(filmPlaneBoundsFor('unknown'), undefined);
  });
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

describe('ranked Fortress', () => {
  it('uses the Fortress objectives and film coordinates', () => {
    const ranked = 'a54808fb-9bf5-432a-a3c3-f76cbea944c1';
    const fortress = '0d1c9255-d912-416c-befc-5f3e5e176df2';
    const objectives = mapObjectivesFor(
      ranked,
      GameVariantCategory.MultiplayerCtf,
    );
    assert.ok(objectives.some((objective) => objective.role === 'flag_spawn'));
    assert.deepEqual(
      objectives,
      mapObjectivesFor(fortress, GameVariantCategory.MultiplayerCtf),
    );
    assert.ok(normalizedPerMeter(ranked));
    assert.equal(normalizedPerMeter(ranked), normalizedPerMeter(fortress));
    assert.deepEqual(filmWorldBoundsFor(ranked), filmWorldBoundsFor(fortress));
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
