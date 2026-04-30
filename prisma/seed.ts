import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db')
const adapter = new PrismaBetterSqlite3({ url: dbPath })
const prisma = new PrismaClient({ adapter })

const properties = [
  'Sunshine PG - Koramangala', 'Green Valley Hostel - Indiranagar',
  'Royal PG - HSR Layout', 'Metro View PG - BTM Layout', 'Tech Park Hostel - Whitefield'
]

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.activity.deleteMany()
  await prisma.visit.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.user.deleteMany()

  const hashedPassword = await bcrypt.hash('admin123', 10)
  const agentPassword = await bcrypt.hash('agent123', 10)

  // Create admin
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@gharpayy.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  // Create agents
  const agents = await Promise.all([
    prisma.user.create({ data: { name: 'Priya Sharma', email: 'agent1@gharpayy.com', password: agentPassword, role: 'AGENT' } }),
    prisma.user.create({ data: { name: 'Rahul Verma', email: 'agent2@gharpayy.com', password: agentPassword, role: 'AGENT' } }),
    prisma.user.create({ data: { name: 'Sneha Patel', email: 'agent3@gharpayy.com', password: agentPassword, role: 'AGENT' } }),
  ])

  console.log(`Created 1 admin + ${agents.length} agents`)

  // Create 20 leads spread across stages
  const leadData = [
    { name: 'Amit Kumar', phone: '9876543210', source: 'WEBSITE', stage: 'NEW', budget: 8000, location: 'Koramangala', propertyType: '1BHK' },
    { name: 'Sunita Singh', phone: '9123456789', source: 'REFERRAL', stage: 'CONTACTED', budget: 6000, location: 'Indiranagar', propertyType: 'Single Room' },
    { name: 'Raj Malhotra', phone: '9988776655', source: 'WALK_IN', stage: 'VISIT_SCHEDULED', budget: 12000, location: 'HSR Layout', propertyType: '2BHK' },
    { name: 'Kavya Reddy', phone: '9012345678', source: 'PHONE', stage: 'VISITED', budget: 7500, location: 'BTM Layout', propertyType: 'Single Room' },
    { name: 'Arjun Nair', phone: '9765432109', source: 'SOCIAL_MEDIA', stage: 'NEGOTIATING', budget: 9000, location: 'Whitefield', propertyType: '1BHK' },
    { name: 'Meera Joshi', phone: '9654321098', source: 'WEBSITE', stage: 'CONVERTED', budget: 8500, location: 'Electronic City', propertyType: '2BHK' },
    { name: 'Vikram Yadav', phone: '9543210987', source: 'REFERRAL', stage: 'LOST', budget: 5000, location: 'Koramangala', propertyType: 'Double Sharing', lostReason: 'Found other accommodation' },
    { name: 'Deepa Menon', phone: '9432109876', source: 'WALK_IN', stage: 'NEW', budget: 7000, location: 'Indiranagar', propertyType: 'Single Room' },
    { name: 'Suresh Babu', phone: '9321098765', source: 'PHONE', stage: 'CONTACTED', budget: 10000, location: 'HSR Layout', propertyType: '1BHK' },
    { name: 'Ananya Iyer', phone: '9210987654', source: 'WEBSITE', stage: 'NEW', budget: 6500, location: 'BTM Layout', propertyType: 'Triple Sharing' },
    { name: 'Kiran Rao', phone: '9109876543', source: 'SOCIAL_MEDIA', stage: 'VISITED', budget: 11000, location: 'Whitefield', propertyType: '2BHK' },
    { name: 'Pooja Gupta', phone: '9098765432', source: 'REFERRAL', stage: 'NEGOTIATING', budget: 8000, location: 'Electronic City', propertyType: '1BHK' },
    { name: 'Naveen Kumar', phone: '8987654321', source: 'WALK_IN', stage: 'CONVERTED', budget: 7000, location: 'Koramangala', propertyType: 'Single Room' },
    { name: 'Rekha Pillai', phone: '8876543210', source: 'PHONE', stage: 'CONTACTED', budget: 9500, location: 'Indiranagar', propertyType: '1BHK' },
    { name: 'Aditya Shah', phone: '8765432109', source: 'WEBSITE', stage: 'NEW', budget: 6000, location: 'HSR Layout', propertyType: 'Double Sharing' },
    { name: 'Lakshmi Rao', phone: '8654321098', source: 'SOCIAL_MEDIA', stage: 'VISIT_SCHEDULED', budget: 8500, location: 'BTM Layout', propertyType: 'Single Room' },
    { name: 'Rohit Sharma', phone: '8543210987', source: 'REFERRAL', stage: 'VISITED', budget: 12000, location: 'Whitefield', propertyType: '2BHK' },
    { name: 'Divya Nair', phone: '8432109876', source: 'WALK_IN', stage: 'CONVERTED', budget: 7500, location: 'Electronic City', propertyType: 'Single Room' },
    { name: 'Sanjay Mehta', phone: '8321098765', source: 'PHONE', stage: 'LOST', budget: 5500, location: 'Koramangala', propertyType: 'Triple Sharing', lostReason: 'Budget constraint' },
    { name: 'Preethi Rao', phone: '8210987654', source: 'WEBSITE', stage: 'NEGOTIATING', budget: 9000, location: 'Indiranagar', propertyType: '1BHK' },
  ]

  const leads = []

  for (let i = 0; i < leadData.length; i++) {
    const ld = leadData[i]
    const agent = agents[i % agents.length]
    const moveInDate = new Date()
    moveInDate.setDate(moveInDate.getDate() + 7 + (i * 3))

    const lead = await prisma.lead.create({
      data: {
        ...ld,
        assignedTo: agent.id,
        moveInDate,
        email: `${ld.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      },
    })
    leads.push(lead)

    // Log initial activity
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        userId: agent.id,
        type: 'NOTE',
        description: `Lead captured from ${ld.source.toLowerCase().replace('_', ' ')}`,
      },
    })

    // Log stage activities for advanced leads
    if (ld.stage !== 'NEW') {
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          userId: agent.id,
          type: 'STAGE_CHANGE',
          description: `Stage changed: NEW → ${ld.stage}`,
        },
      })
    }

    if (ld.stage === 'CONVERTED') {
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          userId: admin.id,
          type: 'NOTE',
          description: 'Booking confirmed. Agreement signed.',
        },
      })
    }
  }

  console.log(`Created ${leads.length} leads`)

  // Create 10 visits
  const visitLeads = leads.filter(l =>
    ['VISIT_SCHEDULED', 'VISITED', 'NEGOTIATING', 'CONVERTED'].includes(l.stage)
  )

  const visitStatuses = ['SCHEDULED', 'SCHEDULED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'NO_SHOW', 'COMPLETED', 'SCHEDULED', 'COMPLETED', 'CANCELLED']

  for (let i = 0; i < Math.min(visitLeads.length, 10); i++) {
    const lead = visitLeads[i]
    const agent = agents[i % agents.length]
    const scheduledAt = new Date()
    scheduledAt.setDate(scheduledAt.getDate() + (i < 5 ? i + 1 : -(i - 4)))

    await prisma.visit.create({
      data: {
        leadId: lead.id,
        agentId: agent.id,
        property: properties[i % properties.length],
        scheduledAt,
        status: visitStatuses[i],
        notes: i % 2 === 0 ? 'Client seemed interested in the property' : null,
      },
    })

    const activityType = visitStatuses[i] === 'COMPLETED' ? 'VISIT_COMPLETED'
      : visitStatuses[i] === 'NO_SHOW' ? 'NOTE'
      : visitStatuses[i] === 'CANCELLED' ? 'NOTE'
      : 'VISIT_SCHEDULED'

    const activityDesc = visitStatuses[i] === 'COMPLETED'
      ? `Visit completed at ${properties[i % properties.length]}`
      : visitStatuses[i] === 'NO_SHOW'
      ? `Lead did not show up for visit at ${properties[i % properties.length]}`
      : visitStatuses[i] === 'CANCELLED'
      ? `Visit cancelled at ${properties[i % properties.length]}`
      : `Visit scheduled at ${properties[i % properties.length]}`

    await prisma.activity.create({
      data: {
        leadId: lead.id,
        userId: agent.id,
        type: activityType,
        description: activityDesc,
      },
    })
  }

  console.log('Created 10 visits')
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
