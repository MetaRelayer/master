import { useState } from 'react';
import NFTComponent from 'components/NFT/NFTComponent';
import BannerComponent from 'components/BannerComponent';
import DrawerComponent from 'components/FormComponet/DrawerComponent';
import 'assets/global.css';

export default function App() {
  const [showNFT, setShowNFT] = useState(false);
  return (
    <>
      <BannerComponent setShowNFT={setShowNFT} />
      <DrawerComponent
        size={460}
        title={"Try App"}
        onOpen={showNFT}
        onClose={() => setShowNFT(false)}
      >
        <NFTComponent />
      </DrawerComponent>
    </>
  )
}