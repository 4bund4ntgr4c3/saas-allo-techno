INSERT INTO public.slot_capacity (weekday, period, capacity) VALUES
(1,'matin',6),(1,'apres-midi',6),
(2,'matin',6),(2,'apres-midi',6),
(3,'matin',6),(3,'apres-midi',6),
(4,'matin',6),(4,'apres-midi',6),
(5,'matin',6),(5,'apres-midi',6),
(6,'matin',4),(6,'apres-midi',4)
ON CONFLICT DO NOTHING;