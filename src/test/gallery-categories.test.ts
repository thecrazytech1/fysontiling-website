import { describe, expect, it } from 'vitest';
import { builtInRows } from '@/lib/site-data';
import { assembleContent } from '@/lib/site-content';
import pantry from '@/assets/mccrea-pantry.jpg';
import brickHallway from '@/assets/floor-brick-hallway.jpg';
import brickLiving from '@/assets/floor-brick-living.jpg';
import saunaOutdoor from '@/assets/fingal-sauna-outdoor.jpg';
import kitchenDining from '@/assets/fingal-kitchen-dining.jpg';
import kitchenIsland from '@/assets/fingal-kitchen-island.jpg';
import kitchenWide from '@/assets/fingal-kitchen-wide.jpg';
import livingOutdoor from '@/assets/fingal-living-outdoor.jpg';
import outdoorLiving from '@/assets/fingal-outdoor-living.jpg';

const { gallery, projects } = assembleContent(builtInRows, '');

const floorTiling = new Set([
  brickHallway, brickLiving,
  kitchenDining, kitchenIsland, kitchenWide, livingOutdoor, outdoorLiving,
]);
const expectedType = (image: string) =>
  image === pantry ? 'Splashback'
    : image === saunaOutdoor ? 'Outdoors'
      : floorTiling.has(image) ? 'Floor Tiling'
        : 'Bathroom Tiling';

describe('Project inspiration categories', () => {
  it('includes every supplied project photograph in the appropriate category', () => {
    const photographs = projects.flatMap(project => project.photos.slice(project.magazinePages).map(photo => photo.url));
    expect(photographs).toHaveLength(37);
    for (const image of photographs) {
      const matches = gallery.filter(item => item.image === image);
      expect(matches).toHaveLength(1);
      expect(matches[0]?.type).toBe(expectedType(image));
    }
  });

  it('keeps printed magazine pages out of the inspiration gallery', () => {
    const magazinePages = projects.flatMap(project => project.photos.slice(0, project.magazinePages).map(photo => photo.url));
    expect(magazinePages).toHaveLength(5);
    for (const image of magazinePages) {
      expect(gallery.some(item => item.image === image)).toBe(false);
    }
  });

  it('does not duplicate existing photographs or change the outdoors cover', () => {
    expect(new Set(gallery.map(item => item.image)).size).toBe(gallery.length);
    expect(gallery.filter(item => item.type === 'Outdoors')).toHaveLength(10);
    expect(gallery.filter(item => item.type === 'Outdoors' && item.cover)).toHaveLength(1);
  });

  it('resolves every built-in photo to a bundled image and keeps project covers', () => {
    expect(builtInRows.photos.every(photo => photo.src.startsWith('asset:'))).toBe(true);
    expect(gallery.every(item => item.image.length > 0)).toBe(true);
    expect(projects.map(project => project.slug)).toEqual(['mccrea-project', 'point-leo-project', 'mt-martha-project', 'pardalote-project', 'fingal-project', 'dava-project']);
    for (const project of projects) expect(project.photos.map(photo => photo.url)).toContain(project.cover);
  });
});
