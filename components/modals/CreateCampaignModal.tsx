'use client';
import {
  Box,
  Button,
  InputLabel,
  Modal,
  Stack,
  TextField,
} from '@mui/material';
import { MODAL_STYLE } from '@/utils/globals';
import { FormEvent, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { generateUUID } from '@/utils/uuid';
import { Campaign } from '@/types/Campaign';
import { arrayUnion, doc, runTransaction } from '@firebase/firestore';
import db from '@/utils/firebase';
import { Collection } from '@/types/Scoop';
import { useUser } from '@/hooks/useUser';

const CreateCampaignModal = () => {
  const [open, setOpen] = useState(false);

  const CreateCampaignForm = () => {
    const { user } = useUser();
    const [campaignTitle, setCampaignTitle] = useState('');

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (user) {
        const newCampaignId = generateUUID();
        const baseCollectionId = generateUUID();
        const newCampaign: Campaign = {
          id: newCampaignId,
          title: campaignTitle,
          baseCollectionId: baseCollectionId,
          dmId: user.id,
        };
        const baseCollection: Collection = {
          id: baseCollectionId,
          campaignId: newCampaignId,
          title: campaignTitle,
          type: 'collection',
          breadcrumbs: null,
          scoopIds: [],
        };
        // TODO: Error handling
        await runTransaction(db, async (transaction) => {
          transaction.set(doc(db, 'campaigns', newCampaignId), newCampaign);
          transaction.set(doc(db, 'scoops', baseCollectionId), baseCollection);
          transaction.update(doc(db, 'users', user.id), {
            campaignIds: arrayUnion(newCampaignId),
          });
        });
        setOpen(false);
      }
    };

    const handleInputChange = (event: Object) => {
      // @ts-ignore
      const value = event.target.value;
      setCampaignTitle(value);
    };

    // TODO: Route snackbar to new article and place outside of modal
    return (
      <>
        <form onSubmit={handleSubmit}>
          <Stack direction={'column'} spacing={1}>
            <InputLabel>Campaign Title</InputLabel>
            <TextField
              variant={'outlined'}
              size={'small'}
              fullWidth
              onChange={handleInputChange}
            />
            <Button type={'submit'}>Create new Campaign</Button>
          </Stack>
        </form>
      </>
    );
  };

  return (
    <>
      <Button startIcon={<AddIcon />} onClick={() => setOpen(true)}>
        Create Campaign
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={MODAL_STYLE}>
          <CreateCampaignForm />
        </Box>
      </Modal>
    </>
  );
};
export default CreateCampaignModal;
