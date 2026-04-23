import { db } from '@/lib/db';
import { creators, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const POST = async (req: Request) => {
  try {
    const data = await req.json();

    const [newPost] = await db.insert(creators).values({
      solAdd: data.solAdd,
      title: data.title,
      description: data.description,
      label: data.label,
      amount: data.amount,
      icons: data.icons,
      end: new Date(data.end),
      users: [],
    }).returning();

    return Response.json({ message: 'Post created successfully', data: newPost });
  } catch (error) {
    console.error('Error creating post:', error);
    return Response.json(
      { message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

export const PUT = async (req: Request) => {
  try {
    const data = await req.json();
    const { id, igProfile, views } = data;

    const [updatedPost] = await db.update(users)
      .set({ igProfile, views })
      .where(eq(users.id, id))
      .returning();

    return Response.json({ message: 'Post updated successfully', data: updatedPost });
  } catch (error) {
    console.error('Error updating post:', error);
    return Response.json(
      { message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};
