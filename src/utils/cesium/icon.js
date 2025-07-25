import hlk from '@/assets/svg/marker/hlk.svg';
import h2 from '@/assets/svg/marker/h2.svg';

export const marker = {
  '海康': hlk,
  '氢气': h2,
};

export function getIcon(type) {
  return marker[type];
}
