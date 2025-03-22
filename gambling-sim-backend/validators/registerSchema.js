import vine from '@vinejs/vine';

const userSchema = vine.object({
  username: vine.string(),
  email: vine.string().email(),
  password: vine
    .string()
    .minLength(8)
    .maxLength(32)
    .confirmed(),
});

export default userSchema;

