# Əsas olaraq Node.js-in ən son LTS (Long Term Support) versiyasını istifadə edirik.
# Bu, tətbiqinizin stabil və uzun müddət dəstəklənən bir mühitdə işləməsini təmin edir.
FROM node:lts-alpine

# İş qovluğunu (working directory) `/app` olaraq təyin edirik.
# Bütün sonrakı əmrlər bu qovluq daxilində icra olunacaq.
WORKDIR /app

# `package.json` və `package-lock.json` (və ya `yarn.lock`) fayllarını iş qovluğuna kopyalayırıq.
# Bu addım, yalnız asılılıqlar (dependencies) dəyişdikdə `npm install` əmrinin yenidən işə düşməsini təmin edir.
# Bu da Docker yığma (build) prosesini sürətləndirir, çünki bu fayllar nadir hallarda dəyişir.
COPY package*.json ./

# Node.js asılılıqlarını quraşdırırıq.
# `npm ci` (clean install) istifadə edirik, çünki bu, `package-lock.json` faylına əsaslanaraq
# tam olaraq müəyyən edilmiş versiyaları quraşdırır və beləliklə, istehsal mühitində tutarlılığı təmin edir.
RUN npm ci --only=production

# Bütün layihə fayllarını iş qovluğuna kopyalayırıq.
# Bu, Node.js tətbiqinizin kodunu konteynerə daxil edir.
COPY . .

# Node.js tətbiqinizin dinlədiyi portu təyin edirik.
# Bu, Docker-ə xəbər verir ki, konteyner bu port üzərindən əlaqə qəbul edəcək.
# Adətən, Node.js tətbiqləri 3000 və ya 5000-ci portu istifadə edir.
EXPOSE 5000

# Tətbiqi işə salmaq üçün əmri təyin edirik.
# `npm start` əmri `package.json` faylında təyin edilmiş start skriptini işə salır.
CMD ["npm", "run", "start:prod"]