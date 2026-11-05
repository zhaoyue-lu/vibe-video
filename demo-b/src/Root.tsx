import { Composition } from 'remotion';
import { Vibe } from './Vibe';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Vibe"
      component={Vibe}
      durationInFrames={150}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
